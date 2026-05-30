# Gemini Safety Settings Fix Required

## Issue
The Gemini API is rejecting requests with:
```
[400 Bad Request] * GenerateContentRequest.safety_settings[0]: element predicate failed: $.category in 
(HarmCategory.HARM_CATEGORY_HATE_SPEECH, HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, HarmCategory.HARM_CATEGORY_HARASSMENT, HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY)
```

## Root Cause
File: `app/api/analyze/route.js` (lines 351-366)

**Current safety_settings** (INVALID):
- HARM_CATEGORY_UNSPECIFIED ❌ (not valid for gemini-3.1-flash-lite)
- HARM_CATEGORY_HARASSMENT ✓
- HARM_CATEGORY_HATE_SPEECH ✓
- HARM_CATEGORY_VIOLENCE ❌ (deprecated, should be one of the 5 valid categories)

## Solution
Replace lines 351-366 in `app/api/analyze/route.js` with:

```javascript
                     {
                       category: "HARM_CATEGORY_HATE_SPEECH",
                       threshold: "BLOCK_NONE",
                     },
                     {
                       category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                       threshold: "BLOCK_NONE",
                     },
                     {
                       category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                       threshold: "BLOCK_NONE",
                     },
                     {
                       category: "HARM_CATEGORY_HARASSMENT",
                       threshold: "BLOCK_NONE",
                     },
                     {
                       category: "HARM_CATEGORY_CIVIC_INTEGRITY",
                       threshold: "BLOCK_NONE",
                     },
```

## Valid Categories for gemini-3.1-flash-lite
1. HARM_CATEGORY_HATE_SPEECH ✓
2. HARM_CATEGORY_SEXUALLY_EXPLICIT ✓
3. HARM_CATEGORY_DANGEROUS_CONTENT ✓
4. HARM_CATEGORY_HARASSMENT ✓
5. HARM_CATEGORY_CIVIC_INTEGRITY ✓

## How to Apply
In VS Code:
1. Open `app/api/analyze/route.js`
2. Go to line 351
3. Replace the 4 safety settings blocks with the 5 valid categories above
4. Save and deploy

After fix, Gemini LLM will complete instead of throwing 400 errors.
