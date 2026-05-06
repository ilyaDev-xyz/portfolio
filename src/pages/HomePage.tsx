import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { Experience } from '../sections/Experience';
import { Footer } from '../sections/Footer';
import { Hero } from '../sections/Hero';
import { Projects } from '../sections/Projects';
import { Stack } from '../sections/Stack';
import { Nav } from '../components/Nav';

export function HomePage() {
  return (
    <div className="page">
      <Nav />
      <main>
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Stack />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
