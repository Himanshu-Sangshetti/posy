// The page content streams in after the layout (nav and footer). Without this the footer sits at the top of the screen until the
// content arrives and then jumps down (a layout shift of 0.6). This reserves the screen the content will fill.
export default function Loading() {
  return <main className="au-main" aria-busy="true" />;
}
