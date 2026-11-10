"""Add submission records and trusted judge limits."""
from alembic import op
import sqlalchemy as sa

revision = "20261024_phase3"
down_revision = "6a09d7ddb73e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("problems", sa.Column("time_limit_ms", sa.Integer(), nullable=False, server_default="2000"))
    op.add_column("problems", sa.Column("memory_limit_mb", sa.Integer(), nullable=False, server_default="256"))
    op.add_column("problems", sa.Column("output_limit_kb", sa.Integer(), nullable=False, server_default="64"))
    submission_type = sa.Enum("RUN", "SUBMIT", name="submissiontype")
    submission_status = sa.Enum("QUEUED", "COMPILING", "RUNNING", "COMPLETED", "FAILED", name="submissionstatus")
    verdict = sa.Enum("ACCEPTED", "WRONG_ANSWER", "COMPILATION_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED", "MEMORY_LIMIT_EXCEEDED", "OUTPUT_LIMIT_EXCEEDED", "SYSTEM_ERROR", name="submissionverdict")
    op.create_table(
        "submissions",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("problem_id", sa.UUID(), nullable=False),
        sa.Column("language", sa.String(20), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("submission_type", submission_type, nullable=False),
        sa.Column("status", submission_status, nullable=False),
        sa.Column("verdict", verdict, nullable=True),
        sa.Column("execution_time_ms", sa.Integer(), nullable=True),
        sa.Column("memory_used_kb", sa.Integer(), nullable=True),
        sa.Column("passed_test_cases", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_test_cases", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["problem_id"], ["problems.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_submissions_user_created", "submissions", ["user_id", sa.text("created_at DESC")])
    op.create_index("ix_submissions_problem_created", "submissions", ["problem_id", sa.text("created_at DESC")])


def downgrade() -> None:
    op.drop_index("ix_submissions_problem_created", table_name="submissions")
    op.drop_index("ix_submissions_user_created", table_name="submissions")
    op.drop_table("submissions")
    sa.Enum(name="submissionverdict").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="submissionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="submissiontype").drop(op.get_bind(), checkfirst=True)
    op.drop_column("problems", "output_limit_kb")
    op.drop_column("problems", "memory_limit_mb")
    op.drop_column("problems", "time_limit_ms")
