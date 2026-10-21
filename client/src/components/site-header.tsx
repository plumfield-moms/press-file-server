import type { QueryClient } from "@tanstack/react-query";
import { PanelLeftIcon } from "lucide-react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { Admin } from "./Admin";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { toast } from "./ui/toast";

export function SiteHeader({ queryClient }: { queryClient: QueryClient }) {
	const { user, isLoading } = useUser();
	const { toggleSidebar } = useSidebar();
	if (isLoading || !user) {
		return;
	}
	const admin = user.role === "admin";

	async function handleSubmit(file: File, title: string) {
		const formData = new FormData();
		formData.append("title", title);
		formData.append("file", file);
		const res = await fetch(`/api/new`, {
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
			await queryClient.invalidateQueries({ queryKey: ["proofs"] });
		}
	}
	if (!admin) {
		return (
			<header className="sticky top-0 z-50 flex w-full items-center border-b  bg-plum text-paper">
				<div className="flex h-(--header-height) w-full items-center gap-2 px-4">
					<Button
						className="h-8 w-8"
						variant="ghost"
						size="icon"
						onClick={toggleSidebar}
					>
						<PanelLeftIcon />
					</Button>
					<Separator
						orientation="vertical"
						className="mr-2 data-vertical:h-4 data-vertical:self-auto"
					/>
					<Breadcrumb className="hidden sm:block">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink className="text-paper hover:text-paper">
									Plumfield Press
								</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
		);
	} else {
		return (
			<Dialog>
				<header className="sticky top-0 z-50 flex w-full items-center border-b border-b-sidebar-accent  bg-plum text-paper">
					<div className="flex h-(--header-height) w-full items-center gap-2 px-4">
						<Button
							className="h-8 w-8"
							variant="ghost"
							size="icon"
							onClick={toggleSidebar}
						>
							<PanelLeftIcon />
						</Button>
						<Separator
							orientation="vertical"
							className="mr-2 data-vertical:h-4 data-vertical:self-auto bg-sidebar-accent"
						/>
						<Breadcrumb className="hidden sm:block">
							<BreadcrumbList>
								<BreadcrumbItem>
									<BreadcrumbLink className="text-paper hover:text-paper">
										Plumfield Press
									</BreadcrumbLink>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
						<DialogTrigger
							render={
								<Button className={"ml-auto mr-0"} variant={"secondary"}>
									Create
								</Button>
							}
						/>
					</div>
				</header>
				<Admin submit={handleSubmit} />
			</Dialog>
		);
	}
}
