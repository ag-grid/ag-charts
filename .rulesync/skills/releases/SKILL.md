---
targets: ['*']
name: releases
description: 'Release conventions and guidelines. Use when preparing releases, naming branches, or understanding release constraints.'
---

# Releases Guide

This guide covers release conventions and guidelines for AG Charts.

## Release Schedule

-   Releases are typically monthly for minor releases, and 6-monthly for major releases (typically in June and December).
-   Patch releases are typically only for critical bug fixes, at most weekly.

## Release Constraints

-   Minor releases cannot have breaking changes, we must hold these back for major releases.
    -   Deprecations are allowed, but must be clearly marked as deprecated and still work as before.
    -   Deprecated features/options are typically immediately removed from public website documentation to discourage use.

## Release Branch Naming

-   Release branch names are of the form `b12.0.0`
