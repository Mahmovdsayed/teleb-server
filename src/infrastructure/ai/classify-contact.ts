import { experimental_decide as decide } from "ai";

const categories = {
  product_inquiry:
    "Questions about furniture products, materials, sizes, or colors",
  pricing_inquiry: "Questions about prices, discounts, or offers",
  order_inquiry: "Questions about an existing order",
  delivery_issue: "Delivery delays or delivery problems",
  product_issue: "Damaged, defective, or incorrect furniture",
  complaint: "Complaints about service or staff",
  suggestion: "Suggestions or feature requests",
  general_inquiry: "General questions about the showroom",
  other: "Messages that do not fit another category",
};

const priorities = {
  low: "Routine questions and non-urgent suggestions",
  medium: "Issues that need attention but are not immediately urgent",
  high: "Urgent problems, serious complaints, damaged deliveries requiring immediate action, or major service disruptions",
};

export async function classifyContact(message: string) {
  const result = await decide({
    model: "typesafe-ai/jev",
    state: {
      customerMessage: message,
      business: "Teleb Furniture",
    },

    questions: {
      category: {
        type: "choice",
        instructions:
          "Classify the customer's message into exactly one category.",
        criteria: categories,
      },

      priority: {
        type: "choice",
        instructions:
          "Determine the urgency based on the actual customer impact, not emotional wording alone.",
        criteria: priorities,
      },

      requiresImmediateEmail: {
        type: "boolean",
        instructions:
          "Should management receive an immediate email because this requires urgent attention?",
      },
    },
  });

  return result.answers;
}
