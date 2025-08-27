// components/ImageSmart.jsx
import Image from 'next/image'

export default function ImageSmart(props) {
  const { sizes = '(min-width: 1024px) 1000px, 100vw', priority = false, ...rest } = props
  return <Image {...rest} sizes={sizes} priority={priority} />
}
