import tkinter as tk

def loadActivities():
    loadedActivities = []
    with open("activities.txt", "r") as file:
        for line in file:
            parts = line.strip().split(",")
            loadedActivities.append({"id": parts[0], "name": parts[1], "price": float(parts[2]), "spaces": int(parts[3])})
    return loadedActivities

activities = loadActivities()

window = tk.Tk()
window.title("Local Activities Booking")
window.geometry("540x400")

def findActivity(activityId):
    for activity in activities:
        if activity["id"] == activityId:
            return activity
    return None

def calculateBooking():
    activity = findActivity(activityEntry.get())
    quantity = int(quantityEntry.get())
    total = activity["price"] + quantity  # Fault 1
    if quantity < activity["spaces"]:     # Fault 2
        resultLabel.config(text=f"Booking total: £{total:.2f}")
    else:
        resultLabel.config(text="Booking accepted")

tk.Label(window, text="Activity ID").pack()
activityEntry = tk.Entry(window)
activityEntry.pack()
tk.Label(window, text="Quantity").pack()
quantityEntry = tk.Entry(window)
quantityEntry.pack()
tk.Button(window, text="Calculate", command=calculateBooking).pack(pady=12)
resultLabel = tk.Label(window, text="Enter booking details")
resultLabel.pack()

window.mainloop()