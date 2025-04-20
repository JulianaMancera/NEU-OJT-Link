interface MessageNotificationProps {
  message: string;
}

export const MessageNotification = ({ message }: MessageNotificationProps) => {
  if (!message) return null;
  
  return (
    <div
      role="alert"
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-fit max-w-[90%] text-center font-medium p-3 rounded shadow-lg border ${
        message.includes("❌")
          ? "bg-red-100 text-red-600 border-red-300"
          : "bg-green-100 text-green-600 border-green-300"
      }`}
    >
      {message}
    </div>
  );
};