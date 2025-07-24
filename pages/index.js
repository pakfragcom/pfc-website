import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/Hero'
import Intro from '../components/Intro'
import SplitBlock from '../components/SplitBlock'



export default function Home() {
  return (
    <div className="bg-black text-white font-sans">
      <Header />
      <Hero />
      <Intro />
      <SplitBlock />
      <Footer />
    </div>
  )
}
