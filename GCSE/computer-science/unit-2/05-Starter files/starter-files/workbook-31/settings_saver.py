import tkinter as tk

SETTINGS_FILE = "settings.txt"

def loadSettings():
    # Return default settings if the file does not exist
    return {"theme": "dark", "notifications": "on"}

def saveSettings():
    pass

settings = loadSettings()
window = tk.Tk()
window.title("Settings")

# Build the interface from the loaded settings.

window.mainloop()