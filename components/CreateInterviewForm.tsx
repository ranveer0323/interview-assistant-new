"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";
import { createInterview } from "@/lib/actions/interview.actions";

// ---- Schema ----
const formSchema = z.object({
  interview_title: z.string().min(1, { message: "Interview title is required." }),
  job_role: z.string().min(1, { message: "Job role is required." }),
  job_description: z.string().min(10, { message: "Please provide a detailed job description." }),
  candidate_name: z.string().optional(),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
  //voice: z.string().min(1, { message: "Please select an avatar voice." }),
});

const CreateInterviewForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interview_title: "",
      job_role: "",
      job_description: "",
      candidate_name: "",
      duration: 15,
      //voice: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const interview = await createInterview(values);
  
    if (interview) {
      redirect(`/interview/${interview.id}`);
    } else {
      console.log("Failed to create an interview.");
      redirect("/");
    }
  };
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
        
        {/* Interview Title */}
        <FormField
          control={form.control}
          name="interview_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Frontend Developer Interview" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Job Role */}
        <FormField
          control={form.control}
          name="job_role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Role / Position</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Senior Software Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Job Description */}
        <FormField
          control={form.control}
          name="job_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full job description here. This will be used by the AI interviewer."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Candidate Name */}
        <FormField
          control={form.control}
          name="candidate_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Candidate Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Duration (minutes)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="15" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Avatar Voice
        <FormField
          control={form.control}
          name="voice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Voice</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="capitalize">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <Button type="submit" className="w-full">Create Interview</Button>
      </form>
    </Form>
  );
};

export default CreateInterviewForm;
