'use client';
// Lofi's puffy 3D clouds: clusters of soft spheres in a matte clay material, drifting behind the windows and
// leaning with the cursor. three.js is loaded only here, so other looks never download it. One still frame for
// reduced motion; paused while the tab is hidden.
import { useEffect, useRef } from 'react';
import type { Vector3 } from 'three';

/** Cloud placements as [x, y] in viewport fractions, size, and a seed for the puff layout. */
const CLOUDS: [number, number, number, number][] = [[0.07, 0.16, 0.62, 1], [0.93, 0.1, 0.5, 2], [0.05, 0.72, 0.48, 3], [0.95, 0.62, 0.58, 4], [0.62, 0.97, 0.4, 5]];

export function Clouds3D({ dark }: { dark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import('three').then(THREE => {
      if (disposed || !ref.current) return;
      const canvas = ref.current;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0, 20);

      scene.add(new THREE.HemisphereLight(dark ? 0x9aa6ff : 0xffffff, dark ? 0x1a1f3d : 0xb9b4d6, dark ? 0.9 : 1.6));
      const sun = new THREE.DirectionalLight(0xffffff, dark ? 0.9 : 1.5); sun.position.set(-4, 6, 8); scene.add(sun);
      const mat = new THREE.MeshStandardMaterial({ color: dark ? 0xc9cdf0 : 0xf2f2f6, roughness: 0.62, metalness: 0 });
      const geo = new THREE.SphereGeometry(1, 40, 28);

      const rand = (s: number) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
      const groups = CLOUDS.map(([, , size, seed]) => {
        const g = new THREE.Group();
        // a big central puff, smaller ones around it, flattened at the base like a real cumulus
        const puffs: [number, number, number, number][] = [[0, 0, 0, 1], [-1.05, -0.25, 0.1, 0.72], [1.0, -0.2, -0.1, 0.78], [-0.45, 0.5, -0.2, 0.62], [0.5, 0.45, 0.25, 0.58], [1.75, -0.45, 0, 0.45], [-1.7, -0.5, 0, 0.42]];
        const n = 4 + Math.floor(rand(seed) * 4);
        for (let i = 0; i < n; i++) {
          const [px, py, pz, r] = puffs[i];
          const m = new THREE.Mesh(geo, mat);
          m.scale.set(r * (0.92 + rand(seed * 10 + i) * 0.16), r * 0.92, r);
          m.position.set(px + (rand(seed + i) - 0.5) * 0.15, py, pz);
          g.add(m);
        }
        g.scale.setScalar(size);
        scene.add(g);
        return g;
      });

      const place = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z, vw = vh * camera.aspect;
        groups.forEach((g, i) => { const [x, y] = CLOUDS[i]; g.userData.base = new THREE.Vector3((x - 0.5) * vw, (0.5 - y) * vh, 0); });
      };
      place();

      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5; };
      let raf = 0; const t0 = performance.now();
      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
        groups.forEach((g, i) => {
          const b = g.userData.base as Vector3;
          g.position.set(b.x + Math.sin(t * 0.25 + i) * 0.35 + mouse.x * (1.2 + i * 0.3), b.y + Math.sin(t * 0.4 + i * 2) * 0.25 - mouse.y * (0.8 + i * 0.2), b.z);
          g.rotation.set(mouse.y * 0.3 + Math.sin(t * 0.3 + i) * 0.08, mouse.x * 0.5 + Math.sin(t * 0.2 + i) * 0.15, 0);
        });
        renderer.render(scene, camera);
        if (!still && !document.hidden) raf = requestAnimationFrame(frame);
      };
      const onVis = () => { if (!document.hidden && !still) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };
      const ro = new ResizeObserver(() => { place(); if (still) frame(performance.now()); });
      ro.observe(canvas);
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('visibilitychange', onVis);
      raf = requestAnimationFrame(frame);
      canvas.dataset.ready = '1';
      cleanup = () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis); geo.dispose(); mat.dispose(); renderer.dispose(); };
    }).catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, [dark]);

  return <canvas ref={ref} aria-hidden className="lf-clouds" />;
}
