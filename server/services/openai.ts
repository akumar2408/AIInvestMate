import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

class AIService {
  async categorizeTransaction(merchant: string, amount: number, direction: string) {
    if (!openai) {
      // Fallback categorization based on simple rules
      const merchantLower = merchant.toLowerCase();
      if (merchantLower.includes('grocery') || merchantLower.includes('market')) return { category: 'Groceries' };
      if (merchantLower.includes('gas') || merchantLower.includes('fuel')) return { category: 'Transportation' };
      if (merchantLower.includes('restaurant') || merchantLower.includes('coffee')) return { category: 'Dining' };
      if (merchantLower.includes('netflix') || merchantLower.includes('spotify')) return { category: 'Entertainment' };
      return { category: direction === 'income' ? 'Income' : 'Other' };
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial transaction categorization expert. Categorize transactions into one of these categories: Groceries, Dining, Transportation, Entertainment, Shopping, Bills, Healthcare, Income, Transfer, Other. Respond with JSON in this format: { 'category': string }"
          },
          {
            role: "user",
            content: `Merchant: ${merchant}, Amount: $${Math.abs(amount)}, Type: ${direction}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return { category: result.category || 'Other' };
    } catch (error) {
      console.error('AI categorization error:', error);
      return { category: 'Other' };
    }
  }

  async generateReport(data: any) {
    if (!openai) {
      return `Financial Report for ${data.period}

Total Transactions: ${data.transactions?.length || 0}
Total Investment Holdings: ${data.investments?.length || 0}
Active Budgets: ${data.budgets?.length || 0}
Active Goals: ${data.goals?.length || 0}

This is a basic report. Connect OpenAI API key for detailed AI-generated insights.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial advisor creating comprehensive reports. Analyze the provided financial data and create a detailed narrative report with insights, trends, and recommendations."
          },
          {
            role: "user",
            content: `Generate a financial report for period ${data.period} with this data:
            
Transactions: ${JSON.stringify(data.transactions?.slice(0, 10) || [])}
Investments: ${JSON.stringify(data.investments || [])}
Budgets: ${JSON.stringify(data.budgets || [])}
Goals: ${JSON.stringify(data.goals || [])}

Provide specific insights about spending patterns, investment performance, budget adherence, and goal progress.`
          }
        ],
      });

      return response.choices[0].message.content || 'Unable to generate report';
    } catch (error) {
      console.error('AI report generation error:', error);
      return 'Error generating AI report. Please try again later.';
    }
  }

  async chatWithCoach(data: any) {
    if (!openai) {
      return "I'm your AI Money Coach! I'd love to help you with financial insights, but I need an OpenAI API key to provide personalized advice. In the meantime, I can see you have financial data tracked - that's a great start!";
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI Money Coach with a mentor personality. Help users with financial planning, budgeting, and investment advice. 
            
User Context:
- Recent transactions: ${JSON.stringify(data.recentTransactions?.slice(0, 5) || [])}
- Budgets: ${JSON.stringify(data.budgets || [])}
- Goals: ${JSON.stringify(data.goals || [])}
- Risk tolerance: ${data.userProfile?.riskTolerance || 'unknown'}

Be helpful, encouraging, and provide actionable advice. Never give specific investment recommendations or tax advice - suggest consulting professionals for complex matters.`
          },
          {
            role: "user",
            content: data.message
          }
        ],
      });

      return response.choices[0].message.content || 'I apologize, but I had trouble processing your request. Please try asking again.';
    } catch (error) {
      console.error('AI chat error:', error);
      return 'I encountered an error while processing your request. Please try again.';
    }
  }

  async whatIfAnalysis(data: any) {
    if (!openai) {
      return {
        summary: "What-if analysis requires OpenAI integration for detailed projections.",
        projectedValue: 0,
        riskAssessment: "Unknown",
        recommendations: ["Connect OpenAI API for detailed analysis"]
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst. Analyze investment scenarios and provide projections. Respond with JSON in this format: { 'summary': string, 'projectedValue': number, 'riskAssessment': string, 'recommendations': string[] }"
          },
          {
            role: "user",
            content: `Analyze this investment scenario:
            
Current investments: ${JSON.stringify(data.currentInvestments || [])}
Proposed changes: ${JSON.stringify(data.deltaInvestments || {})}
Savings change: $${data.savingsChange || 0}

Provide a 10-year projection analysis.`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        summary: result.summary || 'Analysis completed',
        projectedValue: result.projectedValue || 0,
        riskAssessment: result.riskAssessment || 'Moderate',
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('AI what-if analysis error:', error);
      return {
        summary: "Error performing analysis",
        projectedValue: 0,
        riskAssessment: "Unknown",
        recommendations: ["Please try again later"]
      };
    }
  }
}

export const aiService = new AIService();
