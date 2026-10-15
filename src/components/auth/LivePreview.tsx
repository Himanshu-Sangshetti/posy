'use client';
// Your page, as you sign up: a small Desk-style page that writes your name in as you type it and settles with a
// little bounce on every key, so the first thing you make on Posy is already yours.
import { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20);

export function LivePreview({ name, username, host }: { name: string; username: string; host: string }) {
  const controls = useAnimationControls();
  const [shown, setShown] = useState(name);
  useEffect(() => {
    setShown(name);
    controls.start({ rotate: [-4, -2.2, -3], y: [0, -6, 0], transition: { duration: 0.45, ease: 'easeOut' } });
  }, [name, controls]);
  const display = shown.trim() || 'Your name';
  const handle = username || slug(shown) || 'yourname';
  return (
    <motion.div className="lv" animate={controls} initial={{ rotate: -3, y: 20, opacity: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} aria-hidden>
      <div className="lv-bar"><i /><i /><i /><span>{host}/{handle}</span></div>
      <div className="lv-page">
        <div className="lv-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lv-pol" src="/samples/posy.jpg" alt="" />
          <div>
            <p className="lv-name">{display.split(/\s+/).slice(0, -1).join(' ')} <i>{display.split(/\s+/).slice(-1)}</i></p>
            <p className="lv-bio">making small, soft things on the internet</p>
          </div>
        </div>
        <div className="lv-tiles">
          <span className="lv-note">hello, it&apos;s me ✿</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="lv-photo"><img src="/samples/flowers.jpg" alt="" /></span>
          <span className="lv-rec"><b /></span>
        </div>
      </div>
    </motion.div>
  );
}
