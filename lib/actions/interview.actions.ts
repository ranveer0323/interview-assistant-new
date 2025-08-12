'use server';

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "../supabase";

// Create an interview
export const createInterview = async (formData: CreateInterview) => {
  // Uncomment when adding auth:
  const { userId: author } = await auth();

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      ...formData,
      author, // uncomment once auth is added
    })
    .select();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create interview.");
  }

  return data[0];
};

// Get all interviews (can filter if needed)
// export const getAllInterviews = async ({
//   limit = 10,
//   page = 1,
//   position,
//   candidate_name,
// }: GetAllInterviews) => {
//   const supabase = createSupabaseClient();

//   let query = supabase.from("interviews").select();

//   if (position && candidate_name) {
//     query = query
//       .ilike("position", `%${position}%`)
//       .or(`candidate_name.ilike.%${candidate_name}%`);
//   } else if (position) {
//     query = query.ilike("position", `%${position}%`);
//   } else if (candidate_name) {
//     query = query.ilike("candidate_name", `%${candidate_name}%`);
//   }

//   query = query.range((page - 1) * limit, page * limit - 1);

//   const { data: interviews, error } = await query;

//   if (error) throw new Error(error.message);

//   return interviews;
// };

// Get a single interview by ID
export const getInterview = async (id: string) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("interviews")
    .select()
    .eq("id", id);

  if (error) {
    console.error(error);
    return null;
  }

  return data[0];
};

// Update interview feedback
export const updateInterviewFeedback = async (
  id: string,
  feedback: string
) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("interviews")
    .update({ feedback })
    .eq("id", id)
    .select();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update feedback.");
  }

  return data[0];
};
