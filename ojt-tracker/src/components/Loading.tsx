import loadingLogo from '../assets/loading-logo.png';

export const Loading = () => {
  const loadingText = "Loading".split("");

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gradient-to-br from-[#1B38AC] to-[#7792FD]">
      {/* Logo and Animated Text */}
      <div className="flex items-center mb-4 space-x-3">
        <img src={loadingLogo} alt="Loading Logo" className="w-25 h-25" />

        <div className="flex space-x-1">
          {loadingText.map((char, index) => (
            <span
              key={index}
              className="text-white text-5xl font-bold animate-slide-letter"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin ml-3"></div>
      </div>

      {/* Progress Bar */}
      <div className="w-1/5 h-1 bg-transparent rounded-full overflow-hidden">
        <div className="h-full w-0 bg-white animate-progress"></div>
      </div>
    </div>
  );
};
