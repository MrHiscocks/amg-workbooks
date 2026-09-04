import tkinter as tk

window = tk.Tk()
window.title("Temperature Converter")

def convertTemperature():
    # Complete the calculation and update the result label
    pass

tk.Label(window, text="Celsius:").grid(row=0, column=0, padx=10, pady=10)
celsiusEntry = tk.Entry(window)
celsiusEntry.grid(row=0, column=1, padx=10, pady=10)
tk.Button(window, text="Convert", command=convertTemperature).grid(row=1, column=0, columnspan=2, pady=8)
resultLabel = tk.Label(window, text="Enter a temperature")
resultLabel.grid(row=2, column=0, columnspan=2, pady=10)

window.mainloop()