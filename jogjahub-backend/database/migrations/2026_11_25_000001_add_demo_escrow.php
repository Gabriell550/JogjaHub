<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('demo_checkout_key', 64)->nullable();
            $table->unique(['customer_id', 'demo_checkout_key']);
            $table->timestamp('issue_resolved_at')->nullable();
            $table->foreignId('issue_resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('issue_resolution')->nullable();
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->string('fund_status')->nullable()->index();
            $table->string('payout_destination')->nullable();
            $table->timestamp('payout_due_at')->nullable();
            $table->timestamp('payout_completed_at')->nullable();
        });
        Schema::table('tenant_profiles', function (Blueprint $table) {
            $table->text('demo_payout_destination')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tenant_profiles', fn (Blueprint $table) => $table->dropColumn('demo_payout_destination'));
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['fund_status']);
            $table->dropColumn(['fund_status', 'payout_destination', 'payout_due_at', 'payout_completed_at']);
        });
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['customer_id', 'demo_checkout_key']);
            $table->dropConstrainedForeignId('issue_resolved_by');
            $table->dropColumn(['demo_checkout_key', 'issue_resolved_at', 'issue_resolution']);
        });
    }
};
