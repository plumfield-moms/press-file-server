import { Pencil, Vault } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "@/components/ui/toast.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function Admin({
	submitProof,
	submitStore,
}: {
	submitProof: (file: File, title: string) => void;
	submitStore: (file: File, title: string) => void;
}) {
	const [file, setFile] = useState<File | null>();
	const [title, setTitle] = useState<string | null>();
	function handleProof() {
		if (!file || !title) {
			toast.add({
				type: "error",
				description: "Please upload a file and a title",
			});
			return;
		}
		submitProof(file, title);
		setFile(null);
		setTitle(null);
	}
	function handleStore() {
		if (!file || !title) {
			toast.add({
				type: "error",
				description: "Please upload a file and a title",
			});
			return;
		}
		submitStore(file, title);
		setFile(null);
		setTitle(null);
	}

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Admin Create</DialogTitle>
			</DialogHeader>
			<Tabs>
				<TabsList variant="line">
					<TabsTrigger value="proof">
						<Pencil />
						Proofs
					</TabsTrigger>
					<TabsTrigger value="vault">
						<Vault />
						Vault Store
					</TabsTrigger>
				</TabsList>
				<TabsContent value="proof">
					<p className="text-plum">
						Adds a new book to the proofing pipeline. Use this option to add a
						book that needs to be proofed
					</p>
					<FieldGroup className="mt-2">
						<Field>
							<Label>Proof Title</Label>
							<Input
								required
								value={title ?? ""}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</Field>
						<Field>
							<Label>Proof PDF</Label>
							<Input
								required
								type="file"
								accept="application/pdf"
								onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							/>
						</Field>
					</FieldGroup>
					<DialogFooter className="mt-2">
						<DialogClose render={<Button variant={"outline"}>Cancel</Button>} />
						<DialogClose
							render={
								<Button type={"submit"} onClick={() => handleProof()}>
									Upload Proof
								</Button>
							}
						/>
					</DialogFooter>
				</TabsContent>
				<TabsContent value="vault">
					<p className="text-plum">
						Adds a new book to the Vault. Use this option to save finished books
						for later reference
					</p>
					<FieldGroup className="mt-2">
						<Field>
							<Label>Book Title</Label>
							<Input
								required
								value={title ?? ""}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</Field>
						<Field>
							<Label>Book PDF</Label>
							<Input
								required
								type="file"
								accept="application/pdf"
								onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							/>
						</Field>
					</FieldGroup>
					<DialogFooter className="mt-2">
						<DialogClose render={<Button variant={"outline"}>Cancel</Button>} />
						<DialogClose
							render={
								<Button type={"submit"} onClick={() => handleStore()}>
									Upload Book
								</Button>
							}
						/>
					</DialogFooter>
				</TabsContent>
			</Tabs>
		</DialogContent>
	);
}
