import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Download, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useUser } from "@/hooks/use-user";
import { VaultModel } from "@/types";

async function fetchStores() {
	const resp = await fetch("/api/vault/list");
	if (!resp.ok) {
		throw new Error(`Unable to fetch stores ${resp.status}`);
	}
	const data = await resp.json();
	return VaultModel.parse(data);
}

function UploadPopup({
	title,
	storeId,
	submit,
}: {
	title: string;
	storeId: string;
	submit: (file: File | null, title: string, storeID: string) => Promise<void>;
}) {
	const [file, setFile] = useState<File | null>(null);
	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Upload New Version of {title}</DialogTitle>
				<DialogDescription>
					This action will overwrite the current file
				</DialogDescription>
			</DialogHeader>

			<Field>
				<Label>Upload new Version</Label>
				<Input
					type="file"
					accept="application/pdf"
					onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					required
				></Input>
			</Field>
			<DialogFooter>
				<DialogClose render={<Button variant="outline">Cancel</Button>} />
				<DialogClose
					render={
						<Button onClick={() => submit(file, title, storeId)}>Update</Button>
					}
				/>
			</DialogFooter>
		</DialogContent>
	);
}

export function Vault() {
	const queryClient = useQueryClient();
	const { user, isLoading: usrLoading, error: userErr } = useUser();
	const { data, isLoading, error } = useQuery({
		queryKey: ["vault"],
		queryFn: fetchStores,
	});

	async function handleSubmit(
		file: File | null,
		title: string,
		storeID: string,
	) {
		const formData = new FormData();
		if (!file) {
			toast.add({
				type: "error",
				description: "Please select a file to upload",
			});
			return;
		}

		formData.append("title", title);

		formData.append("file", file);

		const res = await fetch(`/api/vault/${storeID}/update`, {
			method: "POST",
			body: formData,
		});
		if (!res.ok) {
			toast.add({
				type: "error",
				description: await res.text(),
			});
		} else {
			toast.add({
				description: "Success!",
			});
			await queryClient.invalidateQueries({ queryKey: ["vault"] });
		}
	}

	if (error || userErr) {
		return (
			<>
				{" "}
				<p>Vault: {error?.message}</p>
				<p>User: {userErr?.message}</p>
			</>
		);
	}

	if (isLoading || usrLoading) {
		return <Spinner />;
	}

	let Rows = data?.map((r) => (
		<Dialog>
			<TableRow>
				<TableCell>{r.title}</TableCell>
				<TableCell>{r.last_edited_time}</TableCell>
				<TableCell className="text-right">
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button size={"icon"} variant={"ghost"}>
									<MoreHorizontal />
								</Button>
							}
						/>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								render={
									<a href={`/api/vault/${r.store_id}/download`} download />
								}
							>
								<Download /> Download
							</DropdownMenuItem>
							<DropdownMenuItem
								className="w-full"
								render={<DialogTrigger />}
								disabled={user?.role !== "admin"}
							>
								<CloudUpload /> Update
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</TableCell>
			</TableRow>
			<UploadPopup storeId={r.store_id} title={r.title} submit={handleSubmit} />
		</Dialog>
	));
	if (!Rows || Rows.length === 0) {
		Rows = [
			<TableRow>
				<TableCell colSpan={3} className="text-center">
					No Book Stores found
				</TableCell>
			</TableRow>,
		];
	}

	return (
		<div className="w-full p-4">
			<Card>
				<CardHeader>
					<CardTitle>Press Vault</CardTitle>
					<CardDescription>Final copies for press projects</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Last Edited Time</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>{Rows}</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
