import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";

export function NavUser() {
	const { user, isLoading } = useUser();
	const { isMobile } = useSidebar();
	if (isLoading || !user) {
		return;
	}
	const initals = user.name
		.split(" ")
		.map((s) => s[0].toUpperCase())
		.join();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						className={"cursor-pointer"}
						render={
							<SidebarMenuButton
								size="lg"
								className="aria-expanded:bg-secondary aria-expanded:text-primary-foreground "
							/>
						}
					>
						<Avatar>
							<AvatarFallback>{initals}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg bg-sidebar-accent"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar>
										<AvatarFallback>{initals}</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight text-primary-foreground">
										<span className="truncate font-medium">{user.name}</span>
										<span className="truncate text-xs">{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuGroup>
							<DropdownMenuItem
								className={"cursor-pointer"}
								render={
									<a href="https://plumfieldmoms.cloudflareaccess.com/cdn-cgi/access/logout" />
								}
							>
								<LogOutIcon />
								Log out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
