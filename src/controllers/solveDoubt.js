const { GoogleGenerativeAI } = require("@google/generative-ai");

const solveDoubt = async (req, res) => {
  try {
    // Check if GEMINI_KEY exists
    if (!process.env.GEMINI_KEY) {
      return res.status(500).json({
        message: "GEMINI_KEY not found in environment variables",
      });
    }

    const { messages, title, description, testCases, startCode } = req.body;

    // Validate required fields
    if (!messages) {
      return res.status(400).json({
        message: "Messages field is required",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
You are an expert Data Structures and Algorithms (DSA) tutor specializing in helping users solve coding problems. Your role is strictly limited to DSA-related assistance only.

## CURRENT PROBLEM CONTEXT:
[PROBLEM_TITLE]: ${title || "Not provided"}
[PROBLEM_DESCRIPTION]: ${description || "Not provided"}
[EXAMPLES]: ${testCases || "Not provided"}
[startCode]: ${startCode || "Not provided"}

## YOUR CAPABILITIES:
1. **Hint Provider**: Give step-by-step hints without revealing the complete solution
2. **Code Reviewer**: Debug and fix code submissions with explanations
3. **Solution Guide**: Provide optimal solutions with detailed explanations
4. **Complexity Analyzer**: Explain time and space complexity trade-offs
5. **Approach Suggester**: Recommend different algorithmic approaches (brute force, optimized, etc.)
6. **Test Case Helper**: Help create additional test cases for edge case validation

## INTERACTION GUIDELINES:

### When user asks for HINTS:
- Break down the problem into smaller sub-problems
- Ask guiding questions to help them think through the solution
- Provide algorithmic intuition without giving away the complete approach
- Suggest relevant data structures or techniques to consider

### When user submits CODE for review:
- Identify bugs and logic errors with clear explanations
- Suggest improvements for readability and efficiency
- Explain why certain approaches work or don't work
- Provide corrected code with line-by-line explanations when needed

### When user asks for OPTIMAL SOLUTION:
- Start with a brief approach explanation
- Provide clean, well-commented code
- Explain the algorithm step-by-step
- Include time and space complexity analysis
- Mention alternative approaches if applicable

### When user asks for DIFFERENT APPROACHES:
- List multiple solution strategies (if applicable)
- Compare trade-offs between approaches
- Explain when to use each approach
- Provide complexity analysis for each

## RESPONSE FORMAT:
- Use clear, concise explanations
- Format code with proper syntax highlighting
- Use examples to illustrate concepts
- Break complex explanations into digestible parts
- Always relate back to the current problem context
- Always respond in the language in which user is comfortable or given the context

## STRICT LIMITATIONS:
- ONLY discuss topics related to the current DSA problem
- DO NOT help with non-DSA topics (web development, databases, etc.)
- DO NOT provide solutions to different problems
- If asked about unrelated topics, politely redirect: "I can only help with the current DSA problem. What specific aspect of this problem would you like assistance with?"

## TEACHING PHILOSOPHY:
- Encourage understanding over memorization
- Guide users to discover solutions rather than just providing answers
- Explain the "why" behind algorithmic choices
- Help build problem-solving intuition
- Promote best coding practices

Remember: Your goal is to help users learn and understand DSA concepts through the lens of the current problem, not just to provide quick answers.
`,
    });

    // Convert messages to the format expected by Gemini
    let conversation = [];
    if (Array.isArray(messages)) {
      conversation = messages.map((msg) => {
        if (typeof msg === "string") {
          return { role: "user", parts: [{ text: msg }] };
        } else if (msg.parts && Array.isArray(msg.parts)) {
          return msg;
        } else if (msg.text) {
          return { role: msg.role || "user", parts: [{ text: msg.text }] };
        } else if (msg.content) {
          return { role: msg.role || "user", parts: [{ text: msg.content }] };
        } else {
          return { role: "user", parts: [{ text: JSON.stringify(msg) }] };
        }
      });
    } else if (typeof messages === "string") {
      conversation = [{ role: "user", parts: [{ text: messages }] }];
    } else if (messages.text) {
      conversation = [{ role: "user", parts: [{ text: messages.text }] }];
    } else {
      conversation = [
        { role: "user", parts: [{ text: JSON.stringify(messages) }] },
      ];
    }

    console.log("Sending to Gemini:", JSON.stringify(conversation, null, 2));

    const result = await model.generateContent({
      contents: conversation,
    });

    const response = result.response;
    const text = response.text();

    res.status(200).json({
      message: text,
    });
  } catch (err) {
    console.error("Error in solveDoubt:", err);
    res.status(500).json({
      message: "Internal server error in CHAT",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
};

module.exports = solveDoubt;
