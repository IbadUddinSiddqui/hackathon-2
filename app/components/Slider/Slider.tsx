import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

type SliderProps = React.ComponentProps<typeof Slider>

export default function SliderDemo({ className, ...props }: SliderProps) {
  return (
    <>
    <h3>Price</h3>
    <Slider
      defaultValue={[50,70]}
      max={100}
      step={1}
      className={cn("w-[60%]", className)}
      {...props}
    /></>
  )
}
