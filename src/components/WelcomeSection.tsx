
interface WelcomeSectionProps {
  userName?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName }) => {
  return (
    <div className="mb-8 group">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 transition-all duration-300 group-hover:scale-105">
        Welcome back, {userName}!
      </h1>
      <p className="text-gray-600 transition-all duration-300 group-hover:translate-x-2">
        What would you like to save today?
      </p>
    </div>
  );
};
