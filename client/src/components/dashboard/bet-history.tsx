import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;

const editBetSchema = z.object({
  team: z.string().min(1, "Team is required"),
  betType: z.enum(["spread", "moneyline", "total"]),
  line: z.coerce.number(),
  odds: z.coerce.number().int(),
  amount: z.coerce.number().positive("Amount must be positive"),
  result: z.enum(["pending", "won", "lost", "push"]),
  gameDate: z.string().optional(),
});
type EditBetForm = z.infer<typeof editBetSchema>;

interface BetHistoryProps {
  bets: any[];
}

function EditBetForm({
  bet,
  onSuccess,
  onCancel,
}: {
  bet: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<EditBetForm>({
    resolver: zodResolver(editBetSchema),
    defaultValues: {
      team: bet.team ?? "",
      betType: bet.betType ?? "moneyline",
      line: bet.line ?? 0,
      odds: bet.odds ?? -110,
      amount: bet.amount ?? 0,
      result: bet.result ?? "pending",
      gameDate: bet.gameDate
        ? format(new Date(bet.gameDate), "yyyy-MM-dd")
        : "",
    },
  });

  const betType = form.watch("betType");

  const mutation = useMutation({
    mutationFn: (data: EditBetForm) =>
      apiRequest("PATCH", `/api/bets/${bet.id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.users.bets.path] });
      await queryClient.invalidateQueries({ queryKey: [api.users.stats.path] });
      await queryClient.invalidateQueries({ queryKey: [api.groups.leaderboard.path] });
      toast({ title: "Bet updated", description: "Your changes have been saved." });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4 pt-2"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="edit-team" className="text-xs text-muted-foreground uppercase tracking-wider">
            Team / Pick
          </Label>
          <Input
            id="edit-team"
            {...form.register("team")}
            className="bg-background/60 border-border/60"
            data-testid="input-edit-team"
          />
          {form.formState.errors.team && (
            <p className="text-xs text-destructive">{form.formState.errors.team.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bet Type</Label>
          <Select
            value={form.watch("betType")}
            onValueChange={(v) => form.setValue("betType", v as any)}
          >
            <SelectTrigger className="bg-background/60 border-border/60" data-testid="select-edit-bettype">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moneyline">Moneyline</SelectItem>
              <SelectItem value="spread">Spread</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(betType === "spread" || betType === "total") && (
          <div className="space-y-1">
            <Label htmlFor="edit-line" className="text-xs text-muted-foreground uppercase tracking-wider">
              Line
            </Label>
            <Input
              id="edit-line"
              type="number"
              step="0.5"
              {...form.register("line")}
              className="bg-background/60 border-border/60"
              data-testid="input-edit-line"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="edit-odds" className="text-xs text-muted-foreground uppercase tracking-wider">
            Odds (American)
          </Label>
          <Input
            id="edit-odds"
            type="number"
            {...form.register("odds")}
            className="bg-background/60 border-border/60"
            data-testid="input-edit-odds"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="edit-amount" className="text-xs text-muted-foreground uppercase tracking-wider">
            Stake ($)
          </Label>
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            {...form.register("amount")}
            className="bg-background/60 border-border/60"
            data-testid="input-edit-amount"
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Result</Label>
          <Select
            value={form.watch("result")}
            onValueChange={(v) => form.setValue("result", v as any)}
          >
            <SelectTrigger className="bg-background/60 border-border/60" data-testid="select-edit-result">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="push">Push</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="edit-gamedate" className="text-xs text-muted-foreground uppercase tracking-wider">
            Game Date
          </Label>
          <Input
            id="edit-gamedate"
            type="date"
            {...form.register("gameDate")}
            className="bg-background/60 border-border/60"
            data-testid="input-edit-gamedate"
          />
        </div>
      </div>

      <Separator className="bg-border/50" />

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-border/50"
          data-testid="button-edit-cancel"
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground"
          data-testid="button-edit-save"
        >
          {mutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export function BetHistory({ bets }: BetHistoryProps) {
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const sortedBets = [...(bets ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalPages = Math.ceil(sortedBets.length / PAGE_SIZE);
  const visibleBets = sortedBets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [bets.length]);

  const getResultColor = (result: string) => {
    switch (result) {
      case "won":  return "bg-primary/20 text-primary border-primary/30";
      case "lost": return "bg-destructive/20 text-destructive border-destructive/30";
      case "push": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:     return "bg-muted text-muted-foreground border-border";
    }
  };

  if (sortedBets.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border/50">
        <p className="text-muted-foreground">No bets recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Text your first bet to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card className="overflow-hidden bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Pick</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Odds</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium text-right">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleBets.map((bet) => (
                <Dialog
                  key={bet.id}
                  open={openId === bet.id}
                  onOpenChange={(open) => {
                    setOpenId(open ? bet.id : null);
                    if (!open) setEditingId(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <tr
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                      data-testid={`row-bet-${bet.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(bet.gameDate || bet.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                        {bet.team} {bet.line !== 0 && (bet.line > 0 ? `+${bet.line}` : bet.line)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">{bet.betType}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                      </td>
                      <td className="px-6 py-4 font-medium">${bet.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`capitalize no-default-active-elevate ${getResultColor(bet.result)}`}
                        >
                          {bet.result}
                        </Badge>
                      </td>
                      <td
                        className={`px-6 py-4 font-bold text-right ${
                          bet.profitLoss > 0
                            ? "text-primary"
                            : bet.profitLoss < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {bet.result === "pending"
                          ? "-"
                          : `${bet.profitLoss > 0 ? "+" : ""}$${Math.abs(bet.profitLoss || 0).toFixed(2)}`}
                      </td>
                    </tr>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-display">
                          {editingId === bet.id ? "Edit Bet" : "Bet Details"}
                        </DialogTitle>
                        {editingId !== bet.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(bet.id)}
                            className="border-border/50 text-muted-foreground hover:text-foreground"
                            data-testid="button-open-edit"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </DialogHeader>

                    {editingId === bet.id ? (
                      <EditBetForm
                        bet={bet}
                        onSuccess={() => {
                          setEditingId(null);
                          setOpenId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="space-y-6 pt-2">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                              Pick
                            </p>
                            <h3 className="text-3xl font-bold text-foreground">
                              {bet.team}{" "}
                              {bet.line !== 0 &&
                                (bet.line > 0 ? `+${bet.line}` : bet.line)}
                            </h3>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-sm px-3 py-1 capitalize ${getResultColor(bet.result)}`}
                          >
                            {bet.result}
                          </Badge>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Bet Type</p>
                            <p className="text-lg font-semibold capitalize">{bet.betType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Odds</p>
                            <p className="text-lg font-semibold">
                              {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Stake</p>
                            <p className="text-lg font-semibold">${bet.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
                            <p
                              className={`text-lg font-bold ${
                                bet.profitLoss > 0
                                  ? "text-primary"
                                  : bet.profitLoss < 0
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {bet.result === "pending"
                                ? "-"
                                : `${bet.profitLoss > 0 ? "+" : ""}$${Math.abs(
                                    bet.profitLoss || 0
                                  ).toFixed(2)}`}
                            </p>
                          </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Placed On</span>
                            <span className="text-foreground font-medium">
                              {format(new Date(bet.createdAt), "MMM d, yyyy HH:mm")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Game Date</span>
                            <span className="text-foreground font-medium">
                              {bet.gameDate
                                ? format(new Date(bet.gameDate), "MMM d, yyyy")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, sortedBets.length)} of {sortedBets.length} bets
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="h-8 w-8 p-0 border-border/50"
              data-testid="button-bets-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={i === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(i)}
                className={`h-8 w-8 p-0 ${
                  i === page
                    ? "bg-primary text-primary-foreground"
                    : "border-border/50 text-muted-foreground"
                }`}
                data-testid={`button-bets-page-${i + 1}`}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages - 1}
              className="h-8 w-8 p-0 border-border/50"
              data-testid="button-bets-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
