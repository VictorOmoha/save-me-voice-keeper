
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isReadonly: boolean;
  categories: string[];
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  isReadonly,
  categories
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="text-foreground">Category</Label>
      {isReadonly ? (
        <Input
          id="category"
          value={selectedCategory}
          readOnly
          className="bg-muted border-border text-foreground"
        />
      ) : (
        <Select value={selectedCategory} onValueChange={onCategoryChange} required>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {categories.map((category) => (
              <SelectItem key={category} value={category} className="text-foreground hover:bg-accent">
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
