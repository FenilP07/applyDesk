import notification from "../models/notification.model.js";

const getNotificationsById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const foundNotification = await notification.findOne({
      _id: id,
      userId,
    });

    if (!foundNotification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    foundNotification.read = true;
    await foundNotification.save();
    return res
      .status(200)
      .json({ success: true, notification: foundNotification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await notification
      .find({ userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

const MarkAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notification.findByIdAndUpdate(id, { read: true });
    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { getNotifications, getNotificationsById, MarkAsRead };
