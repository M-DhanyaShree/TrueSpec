from dataclasses import dataclass


@dataclass(frozen=True)
class ProviderRequirements:
    provider: str
    required_env: tuple[str, ...]
    notes: str


REDDIT_REQUIREMENTS = ProviderRequirements(
    provider="reddit",
    required_env=("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USER_AGENT"),
    notes="Create a Reddit app and provide PRAW credentials.",
)

YOUTUBE_REQUIREMENTS = ProviderRequirements(
    provider="youtube",
    required_env=("YOUTUBE_API_KEY",),
    notes="Enable YouTube Data API v3 and provide a free-tier API key.",
)

MANUFACTURER_SCRAPE_REQUIREMENTS = ProviderRequirements(
    provider="manufacturer_specs",
    required_env=(),
    notes="No key required, but scraping targets must be explicitly approved and rate-limited.",
)


def fetch_reddit_reviews() -> None:
    raise NotImplementedError(
        "Reddit ingestion is stubbed. Required env vars: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT"
    )


def fetch_youtube_reviews() -> None:
    raise NotImplementedError("YouTube ingestion is stubbed. Required env var: YOUTUBE_API_KEY")


def fetch_manufacturer_specs() -> None:
    raise NotImplementedError(
        "Manufacturer scraping is stubbed. Provide approved domains and scraping rules before enabling."
    )
