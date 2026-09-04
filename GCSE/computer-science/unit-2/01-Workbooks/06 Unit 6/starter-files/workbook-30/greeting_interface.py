import tkinter as tk

window = tk.Tk()
window.title("Greeting Interface")
window.geometry("380x220")

def showGreeting():
    # Retrieve the name and update resultLabel
    pass

tk.Label(window, text="Enter your name:").pack(pady=(20, 6))
nameEntry = tk.Entry(window, width=28)
nameEntry.pack()
showButton = tk.Button(window, text="Show greeting", command=showGreeting)
showButton.pack(pady=12)
resultLabel = tk.Label(window, text="Ready")
resultLabel.pack()

window.mainloop()