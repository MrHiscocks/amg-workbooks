import tkinter as tk

events = [
    {"id": "E01", "name": "Community Run", "price": 6.00, "spaces": 40},
    {"id": "E02", "name": "Craft Workshop", "price": 9.50, "spaces": 18}
]

window = tk.Tk()
window.title("Community Event Manager")

def calculateBooking():
    quantity = int(quantityEntry.get())
    price = 6.00
    total = price + quantity  # Fault: investigate
    resultLabel.config(text=f"Total: £{total:.2f}")

# Build or improve the supplied interface.
quantityEntry = tk.Entry(window)
quantityEntry.pack()
tk.Button(window, text="Calculate", command=calculateBooking).pack()
resultLabel = tk.Label(window, text="Ready")
resultLabel.pack()

window.mainloop()