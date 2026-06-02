import logging
import tempfile
import os
from datetime import datetime, timezone

import instaloader
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_functions.scheduler_fn import on_schedule, ScheduledEvent

logger = logging.getLogger(__name__)

app = firebase_admin.initialize_app()
db = firestore.client()


def _scrape_user_posts(username: str, count: int = 3) -> list[dict]:
    """Scrape the latest `count` posts from a public Instagram profile."""
    loader = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        quiet=True,
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        loader.dirname_pattern = tmpdir
        try:
            profile = instaloader.Profile.from_username(loader.context, username)
        except instaloader.exceptions.ProfileNotExistsException:
            logger.warning("Instagram profile not found: %s", username)
            return []
        except Exception as exc:
            logger.error("Failed to load profile %s: %s", username, exc)
            return []

        posts = []
        for post in profile.get_posts():
            if len(posts) >= count:
                break
            posts.append(
                {
                    "shortcode": post.shortcode,
                    "url": f"https://www.instagram.com/p/{post.shortcode}/",
                    "caption": (post.caption or "")[:500],
                    "likes": post.likes,
                    "comments": post.comments,
                    "timestamp": post.date_utc.isoformat(),
                    "thumbnail_url": post.url,
                    "is_video": post.is_video,
                    "media_type": "video" if post.is_video else "image",
                }
            )

    return posts


@on_schedule(schedule="every monday 08:00", timezone="America/Sao_Paulo")
def scrape_instagram_posts(event: ScheduledEvent) -> None:
    """Every Monday fetch the 3 latest posts for all users with an Instagram handle."""
    logger.info("Starting weekly Instagram scrape job")

    users_ref = db.collection("user-preferences")
    docs = users_ref.stream()

    success_count = 0
    skip_count = 0
    error_count = 0

    for doc in docs:
        data = doc.to_dict() or {}
        instagram_username = (data.get("instagram") or "").strip()

        if not instagram_username:
            skip_count += 1
            continue

        user_id = doc.id
        logger.info("Scraping Instagram for user %s (@%s)", user_id, instagram_username)

        try:
            posts = _scrape_user_posts(instagram_username, count=3)

            db.collection("instagram_posts").document(user_id).set(
                {
                    "userId": user_id,
                    "instagram": instagram_username,
                    "posts": posts,
                    "scrapedAt": datetime.now(timezone.utc).isoformat(),
                },
                merge=False,
            )

            logger.info(
                "Saved %d posts for user %s (@%s)", len(posts), user_id, instagram_username
            )
            success_count += 1

        except Exception as exc:
            logger.error(
                "Error scraping Instagram for user %s (@%s): %s",
                user_id,
                instagram_username,
                exc,
            )
            error_count += 1

    logger.info(
        "Instagram scrape job finished — success: %d, skipped: %d, errors: %d",
        success_count,
        skip_count,
        error_count,
    )
