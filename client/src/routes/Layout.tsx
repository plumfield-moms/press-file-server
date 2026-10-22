import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const iframeHeight = "800px";

export const description = "A sidebar with a header and a search form.";

export default function Dashboard() {
	const queryClient = useQueryClient();
	return (
		<div className="[--header-height:calc(--spacing(14))] page-in">
			<SidebarProvider className="flex flex-col">
				<SiteHeader queryClient={queryClient} />
				<div className="flex flex-1">
					<AppSidebar />
					<SidebarInset>
						<Outlet />
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	);
}
