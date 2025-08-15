import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  merchant: z.string().min(1, "Merchant/Description is required"),
  category: z.string().optional(),
  direction: z.enum(["income", "expense", "transfer"]),
  date: z.date(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
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
  "Income",
  "Transfer",
  "Other"
];

export default function TransactionForm({ onSubmit, onCancel, isSubmitting }: TransactionFormProps) {
  const [direction, setDirection] = useState<"income" | "expense" | "transfer">("expense");

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      merchant: "",
      category: "",
      direction: "expense",
      date: new Date(),
      notes: "",
    },
  });

  const handleSubmit = (data: TransactionFormData) => {
    // Convert amount to proper format based on direction
    const amount = direction === "income" ? data.amount : `-${data.amount}`;
    onSubmit({
      ...data,
      amount,
      direction,
    });
  };

  const handleDirectionChange = (value: "income" | "expense" | "transfer") => {
    setDirection(value);
    form.setValue("direction", value);
    
    // Auto-select appropriate category
    if (value === "income") {
      form.setValue("category", "Income");
    } else if (value === "transfer") {
      form.setValue("category", "Transfer");
    } else {
      form.setValue("category", "");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Add Transaction</DialogTitle>
            <Button
              data-testid="button-close-transaction-form"
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Transaction Type */}
            <div className="space-y-2">
              <Label className="text-slate-300">Transaction Type</Label>
              <Select value={direction} onValueChange={handleDirectionChange}>
                <SelectTrigger data-testid="select-transaction-direction" className="bg-slate-700/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        data-testid="input-transaction-amount"
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8 bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Merchant/Description */}
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">
                    {direction === "income" ? "Source" : direction === "transfer" ? "Description" : "Merchant"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-transaction-merchant"
                      {...field}
                      placeholder={
                        direction === "income" 
                          ? "e.g., Acme Corp" 
                          : direction === "transfer" 
                            ? "e.g., Transfer to Savings"
                            : "e.g., Starbucks"
                      }
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          data-testid="button-select-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50",
                            !field.value && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-transaction-category" className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue placeholder="Select category (optional)" />
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-transaction-notes"
                      {...field}
                      placeholder="Add any additional notes..."
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                data-testid="button-cancel-transaction"
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button
                data-testid="button-save-transaction"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Add Transaction
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
