
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="relative max-w-md group">
        <Input
          placeholder="🔍 Search your saved information..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="transition-all duration-300 ease-in-out focus:scale-105 hover:shadow-md group-hover:border-primary/50"
        />
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none" />
      </div>
    </div>
  );
};
