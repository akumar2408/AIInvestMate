import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthlyCap: z.string().min(1, "Monthly limit is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Monthly limit must be a positive number"
  ),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  onSubmit: (data: BudgetFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const categories = [
  "Groceries",
  "Dining",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Healthcare",
  "Utilities",
  "Insurance",
  "Travel",
  "Education",
  "Personal Care",
  "Subscriptions",
  "Other"
];

export default function BudgetForm({ onSubmit, onCancel, isSubmitting }: BudgetFormProps) {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      monthlyCap: "",
    },
  });

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Create Budget</DialogTitle>
            <Button
              data-testid="button-close-budget-form"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-budget-category" className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monthly Limit */}
            <FormField
              control={form.control}
              name="monthlyCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Monthly Limit</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        data-testid="input-budget-amount"
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-slate-400 mt-1">
                    Set your maximum spending limit for this category per month
                  </p>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                data-testid="button-cancel-budget"
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button
                data-testid="button-save-budget"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Create Budget
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
