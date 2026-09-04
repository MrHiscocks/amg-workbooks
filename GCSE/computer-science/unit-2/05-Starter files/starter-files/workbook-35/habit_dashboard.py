import tkinter as tk
from tkinter import ttk, messagebox

HABIT_FILE = "habits.txt"
habits = []

# Plan: load data, build interface, refresh display, handle events, save data.

window = tk.Tk()
window.title("Habit Dashboard")
window.geometry("820x560")

# Build the dashboard in controlled stages.

window.mainloop()