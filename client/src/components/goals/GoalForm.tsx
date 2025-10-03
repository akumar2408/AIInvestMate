import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100, "Goal name is too long"),
  target: z.string().min(1, "Target amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Target amount must be a positive number"
  ),
  current: z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
    "Current amount must be zero or positive"
  ),
  targetDate: z.date().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function GoalForm({ onSubmit, onCancel, isSubmitting }: GoalFormProps) {
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target: "",
      current: "0",
      targetDate: undefined,
    },
  });

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Create Financial Goal</DialogTitle>
            <Button
              data-testid="button-close-goal-form"
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
            {/* Goal Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Goal Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-goal-name"
                      {...field}
                      placeholder="e.g., Emergency Fund, Vacation, New Car"
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Amount */}
            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Target Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        data-testid="input-goal-target"
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

            {/* Current Amount */}
            <FormField
              control={form.control}
              name="current"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Current Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        data-testid="input-goal-current"
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
                    How much have you already saved toward this goal?
                  </p>
                </FormItem>
              )}
            />

            {/* Target Date */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Target Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          data-testid="button-select-target-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50",
                            !field.value && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Select target date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  <p className="text-xs text-slate-400 mt-1">
                    When would you like to achieve this goal?
                  </p>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                data-testid="button-cancel-goal"
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button
                data-testid="button-save-goal"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Create Goal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
