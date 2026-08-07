
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ManageUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Search, filter, and manage all users on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Input placeholder="Search by name, email, or phone..." className="flex-1" />
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="chw">Community Health Worker</SelectItem>
              <SelectItem value="clinician">Clinician</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Search results will appear here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
