<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('issue_reported_at')->nullable();
            $table->text('completion_issue')->nullable();
            $table->timestamp('completion_reminded_at')->nullable();
            $table->index(['status', 'fulfilled_at']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['status', 'fulfilled_at']);
            $table->dropColumn(['fulfilled_at', 'completed_at', 'issue_reported_at', 'completion_issue', 'completion_reminded_at']);
        });
    }
};
