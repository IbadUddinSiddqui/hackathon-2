import {
   
    ColorPickerRoot,
    ColorPickerSwatchGroup,
    ColorPickerSwatchTrigger,
    
  } from "@/components/ui/color-picker"
  
  const ColorPicker = () => {
    return (
      <ColorPickerRoot alignItems="flex-start ">
        
        <ColorPickerSwatchGroup >
          {swatches.map((item) => (
            <ColorPickerSwatchTrigger  style={{
                width: "40px", // Size of the color box
                height: "40px", // Size of the color box
                borderRadius: "50%", // Makes it circular
                backgroundColor: item, // Background color
                margin: "5px", // Space between swatches
                border: "none", // Remove border from button
                cursor: "pointer", // Add pointer cursor for interactivity
              }} key={item} value={item} />
          ))}
        </ColorPickerSwatchGroup>
      </ColorPickerRoot>
    )
  }
  
  const swatches = ["red", "green", "blue", "purple", "orange", "pink"]
   export default ColorPicker