import * as Yup from "yup";

/**
 * Global validation schemas for consistent validation across the application
 */

// Helper function to count words
const countWords = (str) => {
  if (!str || typeof str !== 'string') return 0;
  // Remove HTML tags for rich text editors, then count words
  const text = str.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Helper function to get words from string
const getWords = (str) => {
  if (!str || typeof str !== 'string') return [];
  const text = str.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(word => word.length > 0);
};

// Helper function to count alphabets in a word (only letters, no numbers or special chars)
const countAlphabets = (word) => {
  if (!word) return 0;
  return (word.match(/[a-zA-Z]/g) || []).length;
};

// Name validation: max 20 alphabets per word, max 50 words total, allows all characters
export const nameValidation = Yup.string()
  .required("Name is required")
  .test("max-words", "Name must be 50 words or less", function(value) {
    if (!value) return true;
    const wordCount = countWords(value);
    return wordCount <= 50;
  })
  .test("max-alphabets-per-word", "Each word must have 20 alphabets or less", function(value) {
    if (!value) return true;
    const words = getWords(value);
    for (const word of words) {
      const alphabetCount = countAlphabets(word);
      if (alphabetCount > 20) {
        return this.createError({ message: `Word "${word}" has ${alphabetCount} alphabets. Maximum 20 alphabets per word allowed.` });
      }
    }
    return true;
  });

// Description validation: max 100 words, allows all characters
export const descriptionValidation = Yup.string()
  .required("Description is required")
  .test("max-words", "Description must be 100 words or less", function(value) {
    if (!value) return true;
    const wordCount = countWords(value);
    return wordCount <= 100;
  });

// Goal name validation (specific to goals)
export const goalNameValidation = nameValidation;

// Project name validation (specific to projects)
export const projectNameValidation = nameValidation;

// Goal description validation
export const goalDescriptionValidation = descriptionValidation;

// Project description validation
export const projectDescriptionValidation = descriptionValidation;

// Idea name validation (specific to ideas)
export const ideaNameValidation = nameValidation;

// Idea description validation
export const ideaDescriptionValidation = descriptionValidation;

