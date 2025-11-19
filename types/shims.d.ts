declare module "gel" {
  const Gel: any;
  export default Gel;
}

declare module "mysql2" {
  const mysql: any;
  export default mysql;
}

declare module "mysql2/promise" {
  const mysqlPromise: any;
  export default mysqlPromise;
}

declare module "lucide-react" {
  type Icon = any;
  export const AlertCircle: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const ArrowLeftRight: Icon;
  export const ArrowUpRight: Icon;
  export const Bell: Icon;
  export const Bot: Icon;
  export const Brain: Icon;
  export const Building: Icon;
  export const Calendar: Icon;
  export const CalendarIcon: Icon;
  export const Car: Icon;
  export const Check: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const Circle: Icon;
  export const Clock: Icon;
  export const Coffee: Icon;
  export const Crown: Icon;
  export const CreditCard: Icon;
  export const DollarSign: Icon;
  export const Dot: Icon;
  export const Edit: Icon;
  export const FileText: Icon;
  export const Film: Icon;
  export const GripVertical: Icon;
  export const LayoutDashboard: Icon;
  export const Lightbulb: Icon;
  export const LogOut: Icon;
  export const Menu: Icon;
  export const MessageCircle: Icon;
  export const Minus: Icon;
  export const MoreHorizontal: Icon;
  export const PanelLeft: Icon;
  export const PieChart: Icon;
  export const Plus: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Shield: Icon;
  export const ShoppingCart: Icon;
  export const Sparkles: Icon;
  export const Target: Icon;
  export const Trash2: Icon;
  export const TrendingDown: Icon;
  export const TrendingUp: Icon;
  export const User: Icon;
  export const Wallet: Icon;
  export const X: Icon;
  export const Zap: Icon;
  const LucideReact: any;
  export default LucideReact;
}

declare module "date-fns" {
  export function format(
    date: Date | number,
    formatStr: string,
    options?: Record<string, any>
  ): string;
}

declare module "drizzle-orm" {
  export function relations(
    table: any,
    cb: (helpers: { one: (table: any, config?: any) => any; many: (table: any) => any }) => any
  ): any;
  export function sql(strings: TemplateStringsArray, ...expr: any[]): any;
  export function eq(...args: any[]): any;
  export function and(...args: any[]): any;
  export function gte(...args: any[]): any;
  export function lte(...args: any[]): any;
  export function desc(...args: any[]): any;
  export type InferSelectModel<T = any> = any;
  export type InferInsertModel<T = any> = any;
}

declare module "drizzle-orm/pg-core" {
  export function boolean(column: string): any;
  export function decimal(column: string, config?: any): any;
  export function foreignKey(config: any): { onDelete: (rule: string) => any };
  export function index(name: string): { on: (...args: any[]) => any };
  export function integer(column: string): any;
  export function jsonb(column: string): any;
  export function pgTable(
    name: string,
    columns: Record<string, any>,
    extras?: (table: any) => any
  ): any;
  export function text(column: string): any;
  export function timestamp(column: string, options?: any): any;
  export function varchar(column: string, options?: any): any;
}

declare module "drizzle-orm/neon-serverless" {
  export function drizzle(connection: any): any;
}

declare module "drizzle-zod" {
  export const createInsertSchema: (...args: any[]) => any;
}
