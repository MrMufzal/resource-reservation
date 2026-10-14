import { ResourceForm } from "@/components/ResourceForm";

export default function NewResourcePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add resource</h1>
      <ResourceForm />
    </div>
  );
}
