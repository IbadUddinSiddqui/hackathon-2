import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input" // Assuming you have an Input component

export default function Order() {
  return (
    <Card className="overflow-hidden" x-chunk="order-summary">
      <CardHeader className="bg-muted/50 p-4">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-xl font-extrabold">$299.00</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className=" text-red-500 text-xl font-extrabold  ">-$10.00</span> {/* Adjust as needed */}
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="text-xl font-extrabold">$5.00</span>
          </div>
          
          <div className="flex justify-between font-semibold">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold">$294.00</span>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Enter discount code" 
              className="w-full" 
            />
            <Button variant="outline" className="h-8">Apply</Button>
          </div>
        </div>
      </CardContent>
      <div className="mnin-w-full">
      <CardFooter className="flex justify-center p-4">
        <Button className="min-w-96 md:w-auto">Proceed to Checkout</Button>
      </CardFooter></div>
    </Card>
  )
}
