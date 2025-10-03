import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";

const investmentSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol is too long").transform(val => val.toUpperCase()),
  name: z.string().optional(),
  type: z.enum(["stock", "etf", "crypto", "mutual_fund"]),
  quantity: z.string().min(1, "Quantity is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Quantity must be a positive number"
  ),
  costBasis: z.string().min(1, "Cost basis is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Cost basis must be a positive number"
  ),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentFormProps {
  onSubmit: (data: InvestmentFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const investmentTypes = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "mutual_fund", label: "Mutual Fund" },
];

export default function InvestmentForm({ onSubmit, onCancel, isSubmitting }: InvestmentFormProps) {
  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      symbol: "",
      name: "",
      type: "stock",
      quantity: "",
      costBasis: "",
    },
  });

  const watchedType = form.watch("type");

  const getSymbolPlaceholder = () => {
    switch (watchedType) {
      case "stock":
        return "e.g., AAPL, MSFT, GOOGL";
      case "etf":
        return "e.g., VOO, SPY, VTI";
      case "crypto":
        return "e.g., BTC, ETH, ADA";
      case "mutual_fund":
        return "e.g., VTSAX, FXAIX";
      default:
        return "Enter symbol";
    }
  };

  const getQuantityLabel = () => {
    switch (watchedType) {
      case "crypto":
        return "Amount";
      default:
        return "Shares";
    }
  };

  const getCostBasisLabel = () => {
    switch (watchedType) {
      case "crypto":
        return "Average Price per Unit";
      default:
        return "Average Price per Share";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white">Add Investment</DialogTitle>
            <Button
              data-testid="button-close-investment-form"
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
            {/* Investment Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Investment Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-investment-type" className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symbol */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Symbol/Ticker</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-investment-symbol"
                      {...field}
                      placeholder={getSymbolPlaceholder()}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name (Optional) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-investment-name"
                      {...field}
                      placeholder="e.g., Apple Inc., Bitcoin"
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">{getQuantityLabel()}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-investment-quantity"
                      {...field}
                      type="number"
                      step={watchedType === "crypto" ? "0.00000001" : "0.001"}
                      placeholder="0"
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Basis */}
            <FormField
              control={form.control}
              name="costBasis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">{getCostBasisLabel()}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        data-testid="input-investment-cost-basis"
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
                    The average price you paid per {watchedType === "crypto" ? "unit" : "share"}
                  </p>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                data-testid="button-cancel-investment"
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              >
                Cancel
              </Button>
              <Button
                data-testid="button-save-investment"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Add Investment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
