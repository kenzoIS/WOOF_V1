# Graph Report - WOOF_V1  (2026-10-03)

## Corpus Check
- Large corpus: 376 files · ~549,947 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2656 nodes · 5888 edges · 140 communities (94 shown, 46 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 136

## God Nodes (most connected - your core abstractions)
1. `cn()` - 214 edges
2. `AnalyticsService` - 172 edges
3. `react` - 77 edges
4. `fetchApi()` - 72 edges
5. `ChatbotService` - 65 edges
6. `@nestjs/common` - 56 edges
7. `lucide-react` - 55 edges
8. `ActivationService` - 53 edges
9. `Cafe()` - 50 edges
10. `AISimulation()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `AccordionItem()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AccordionTrigger()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AccordionContent()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/accordion.tsx → frontend/src/app/components/ui/utils.ts
- `AlertTitle()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/alert.tsx → frontend/src/app/components/ui/utils.ts
- `AlertDescription()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/app/components/ui/alert.tsx → frontend/src/app/components/ui/utils.ts

## Import Cycles
- None detected.

## Communities (140 total, 46 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (20): mongoose, mongoose, mongoose, mongoose, mongoose, HolidayService, HolidayCache, HolidayCacheDocument (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (57): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator(), Card(), CardAction() (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (9): AuthController, AuthService, LoginDto, PasswordResetRequestDto, ResetPasswordDto, VerifyResetOtpDto, ChangePasswordDto, LoginActivityDto (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (36): build_basket_index(), compute_attach_rate_metrics(), normalize_items_input(), base_result(), build_item_metrics(), build_low_association_bundles(), build_pair_counts(), build_pricing_fields() (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (59): dependencies, canvas-confetti, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @emotion/react (+51 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (19): SettingsController, AlertEvaluationMetrics, AlertThresholdKey, AlertThresholds, DATA_RETENTION_LIMITS, DataRetentionSettings, DEFAULT_ALERT_THRESHOLDS, DEFAULT_DATA_RETENTION_DAYS (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (49): ActivationRecommendation, AssetBlock(), Campaign, CampaignActivationLayer(), PayloadRow(), statusColor, AlertThresholds, apiCache (+41 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (4): ForecastEvaluationPlan, DailyValue, ForecastModule, NormalizedDailyValue

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (45): author, description, mongoose, @nestjs/config, @nestjs/mongoose, @supabase/supabase-js, @types/node, typescript (+37 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (43): SettingsPage(), Checkbox(), Switch(), applyDataRetention(), changeDashboardPassword(), disableTwoFactor(), downloadSettingsDataExport(), enableTwoFactor() (+35 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (13): CacheEntry, AppModule, AuthModule, ChatbotModule, IpWhitelistGuard, GeoBlockMiddleware, SupabaseModule, LlmModule (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (40): AISimulationPage(), BundleCandidate, BundleExplanationDrawer(), Badge(), badgeVariants, BundleArchive, BundlePlanningContext, createBundleArchive() (+32 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (16): ActivationModule, ActivationRecommendation, CampaignStatus, GeneratedCampaignAssets, PetHubCampaignPayload, CampaignActivation, CampaignActivationDocument, CampaignActivationSchema (+8 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (17): AnalyticsModule, CommonModule, CachedHoliday, HolidayCache, HolidayCacheSchema, WeatherCache, WeatherCacheSchema, ContextModule (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (38): addDays(), buildExogenousRows(), buildExternalContext(), calendarFeatures(), classifyCafeSegment(), classifyServicesSegment(), compareModule(), compareSegmentedModule() (+30 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (33): @types/node, typescript, name, private, type, version, HoverCardContent(), autoprefixer (+25 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (33): AuditPage(), Header(), buildNotifications(), relativeTime(), HeaderProps, Notification, Avatar(), AvatarFallback() (+25 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (25): ExecutiveOverviewPage(), RootCauseExplorerPage(), ExplanationFeature, GenAiExplanationCard(), GenAiExplanationCardProps, KpiDetailData, KpiDetailModal(), KpiDetailModalProps (+17 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (19): BundleExplanationDrawerProps, ImageWithFallback(), BundleCreatorProps, PromoBundleCard(), MerchandisingPanelProps, Calendar(), RadioGroup(), RadioGroupItem() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (29): CHANNEL_OPTIONS, CsvUploadRecord, DataIngestion(), DataIngestionProps, formatCurrency(), formatNumber(), Metrics, toNumber() (+21 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (17): CafeForecastSelection, CrossSellOptions, ForecastErrorMetrics, ForecastMode, ForecastOverrides, HomeRange, ModelResult, TrafficColumn (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (27): ServicesPage(), addDays(), clampHistoryDate(), countDays(), DateBounds, DateRange, encodeCustomRange(), filterByDateRange() (+19 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (18): AnswerMode, ChatHistoryItem, DashboardIntent, MONTH_ALIASES, MONTHS, NarrativeGoal, QueryPlan, RangeKey (+10 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, @aws-sdk/credential-providers, axios, class-transformer, class-validator, csv-parse, @google/genai (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (14): { createClient }, supabase, { createClient }, supabase, { createClient }, supabase, { createClient }, supabase (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (17): { createClient }, { execSync }, supabase, { createClient }, dotenv, { execSync }, supabase, { execSync } (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (22): App(), getValidDashboardAuth(), Layout(), LayoutProps, NotificationCenter(), CACHE_INVALIDATING_EVENTS, QUIET_EVENTS, RealtimeEvent (+14 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (26): CafePage(), DropdownMenu(), DropdownMenuContent(), DropdownMenuTrigger(), Slider(), activateHappyHour(), getCafeCoAttachment(), getNextQuietPeriod() (+18 more)

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (21): LoginPage(), SmartReportsPage(), ConnectionBanner(), Button(), Toaster(), deleteSmartReport(), generateSmartReport(), getSmartReports() (+13 more)

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (26): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+18 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (10): build_model(), config_list(), normalize_forecast_days(), parse_splits(), run(), build_target_transformer(), compute_vif_diagnostics(), ExogenousStandardizer (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.08
Nodes (14): dotenv, mongoose, dotenv, dotenv, { execSync }, dotenv, { execSync }, { createClient } (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (20): HomePage(), PrescriptiveIntelligencePage(), ErrorType, SuccessType, getCurrentWeather(), getHomeOverview(), buildHeatmapDaysFromAnchor(), CurrentWeather (+12 more)

### Community 39 - "Community 39"
Cohesion: 0.08
Nodes (14): InputOTP(), InputOTPGroup(), InputOTPSlot(), PopoverContent(), ScrollArea(), ScrollBar(), Textarea(), clsx (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (5): AuditController, AuditInterceptor, AuditModule, AuditLogInput, AuditService

### Community 43 - "Community 43"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 44 - "Community 44"
Cohesion: 0.28
Nodes (18): errorConfig, ErrorModal(), ErrorModalProps, ModelDetailsModal(), successConfig, SuccessModal(), SuccessModalProps, AlertDialog() (+10 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (4): calculate_queue_metrics(), erlang_c(), monte_carlo_staffing(), recommend_staffing()

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (12): { MongoClient }, { S3Client, PutObjectCommand }, { S3Client, ListBucketsCommand }, { createClient }, dotenv, { MongoClient }, @aws-sdk/client-s3, mongodb (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (20): { createClient }, getDateId(), getIsoDayOfWeek(), getSeason(), getWeekOfYear(), { MongoClient }, normalizeChannel(), normalizeSegment() (+12 more)

### Community 49 - "Community 49"
Cohesion: 0.21
Nodes (17): RetailPage(), Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader (+9 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx (+12 more)

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (8): build_payload(), main(), build_payload(), main(), assert_forecast(), build_data(), build_exogenous(), main()

### Community 53 - "Community 53"
Cohesion: 0.19
Nodes (3): detectChannel(), normalizeUploadChannel(), Transaction

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (9): build_training_examples(), detect_quiet_period(), load_cached_model(), parse_manila_timestamps(), predict_promo_success(), safe_float(), series_or_default(), synthetic_fallback_examples() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.12
Nodes (13): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarPortal(), MenubarRadioItem(), MenubarSeparator() (+5 more)

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (9): normalize_forecast_days(), run_forecast(), _as_aligned_arrays(), evaluate_forecast_metrics(), _manual_bias_percent(), _manual_mase(), _manual_regression_metrics(), _manual_smape() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (12): addDays(), buildPhilippineNationalHolidays(), calculateHolyWeek(), enumerateDates(), ExogenousCacheStatus, ExogenousProviderDiagnostics, ExogenousRow, getLastMondayOfAugust() (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.12
Nodes (10): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+2 more)

### Community 60 - "Community 60"
Cohesion: 0.24
Nodes (11): resample_and_evaluate(), build_exog_matrix(), build_forecast_exog(), default_exog_value(), fit_best(), fit_default(), fit_model(), normalize_forecast_days() (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (13): buildDailyValuesFromTransactionLines(), computeOutlierCap(), DailyAccumulator, getCalendarFeatures(), isDateKey(), normalizeDailySeries(), percentile(), safeNumber() (+5 more)

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (13): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (15): scripts, build, build:render, format, lint, python:install, start, start:debug (+7 more)

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (14): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (11): FeedbackPage(), Progress(), FeedbackPromotion, FeedbackSummary, generateLlmExplanation(), getFeedbackPromotions(), getFeedbackSummary(), submitFeedbackRating() (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.26
Nodes (11): InfoTooltip(), InfoTooltipProps, KPICard(), KPICardProps, SidebarMenuButton(), sidebarMenuButtonVariants, Tooltip(), TooltipContent() (+3 more)

### Community 67 - "Community 67"
Cohesion: 0.22
Nodes (13): aggregatePoints(), BacktestMetrics, findClosestDate(), formatCurrency(), formatDateLabel(), formatFullCurrency(), ModernTooltip(), ThreeZoneForecastChart() (+5 more)

### Community 68 - "Community 68"
Cohesion: 0.14
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent(), DropdownMenuSubTrigger() (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.14
Nodes (13): dependencies, dotenv, mongodb, mongoose, @nestjs/config, @nestjs/mongoose, supabase, @supabase/supabase-js (+5 more)

### Community 70 - "Community 70"
Cohesion: 0.27
Nodes (11): addDays(), buildExogenousRows(), buildFutureExogenousRows(), isWeekend(), main(), metricSummary(), path, runPython() (+3 more)

### Community 71 - "Community 71"
Cohesion: 0.26
Nodes (3): AppController, AppService, @nestjs/testing

### Community 72 - "Community 72"
Cohesion: 0.17
Nodes (11): devDependencies, @cloudflare/workers-types, wrangler, name, private, scripts, deploy, dev (+3 more)

### Community 73 - "Community 73"
Cohesion: 0.20
Nodes (8): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerPortal(), DrawerTitle(), vaul

### Community 77 - "Community 77"
Cohesion: 0.27
Nodes (10): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartStyle(), ChartTooltipContent(), getPayloadConfigFromPayload() (+2 more)

### Community 78 - "Community 78"
Cohesion: 0.22
Nodes (10): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+2 more)

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (8): assert, futureExogenous, history, path, payload, pyProcess, scriptPath, { spawn }

### Community 81 - "Community 81"
Cohesion: 0.20
Nodes (6): df, fs, content, fs, fs, lines

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.22
Nodes (6): { Client }, fs, pg, { Client }, connStr, dotenv

### Community 85 - "Community 85"
Cohesion: 0.33
Nodes (7): BehavioralBridgesPage(), BehavioralBridges(), CrossSellRule, getSectorColor(), SECTOR_COLORS, SLOT_POSITIONS, truncateLabel()

### Community 86 - "Community 86"
Cohesion: 0.28
Nodes (7): Pagination(), PaginationContent(), PaginationEllipsis(), PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious()

### Community 87 - "Community 87"
Cohesion: 0.31
Nodes (7): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants, @radix-ui/react-toggle, @radix-ui/react-toggle-group

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (6): args, { createClient }, envPath, fs, mongoose, path

### Community 89 - "Community 89"
Cohesion: 0.25
Nodes (7): compilerOptions, module, moduleResolution, strict, target, types, include

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 91 - "Community 91"
Cohesion: 0.39
Nodes (7): dotenv, fs, getDateId(), getIsoDayOfWeek(), getLocalDateString(), getWeekOfYear(), run()

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (5): { createClient }, envPath, fs, mongoose, path

### Community 93 - "Community 93"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 94 - "Community 94"
Cohesion: 0.47
Nodes (5): CACHEABLE_PREFIXES, corsHeaders(), Env, fetch(), isCacheable()

### Community 95 - "Community 95"
Cohesion: 0.40
Nodes (4): ModelDetailsModalProps, ModelDiagnosticsProps, ForecastRun, ScenarioForecastSet

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (4): AccordionContent(), AccordionItem(), AccordionTrigger(), @radix-ui/react-accordion

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (4): { createClient }, fs, sql, supabase

### Community 98 - "Community 98"
Cohesion: 0.47
Nodes (5): dotenv, fs, getDateId(), getLocalDateString(), run()

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (5): { createClient }, dotenv, { execSync }, run(), supabase

### Community 100 - "Community 100"
Cohesion: 0.40
Nodes (3): csvUploadSchema, mongoose, transactionSchema

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (3): { createClient }, dotenv, supabase

### Community 102 - "Community 102"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 103 - "Community 103"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 106 - "Community 106"
Cohesion: 0.40
Nodes (3): { createClient }, dotenv, supabase

### Community 107 - "Community 107"
Cohesion: 0.40
Nodes (3): { createClient }, dotenv, { execSync }

### Community 108 - "Community 108"
Cohesion: 0.40
Nodes (3): { createClient }, dotenv, { execSync }

### Community 109 - "Community 109"
Cohesion: 0.40
Nodes (3): dotenv, { execSync }, fs

### Community 120 - "Community 120"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

### Community 121 - "Community 121"
Cohesion: 0.50
Nodes (3): code2, code3, fs

## Knowledge Gaps
- **639 isolated node(s):** `mongoose`, `mongoose`, `mongoose`, `mongoose`, `mongoose` (+634 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 949 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `Community 14` to `Community 0`, `Community 2`, `Community 71`, `Community 40`, `Community 41`, `Community 8`, `Community 11`, `Community 16`, `Community 17`, `Community 25`, `Community 58`, `Community 27`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `AnalyticsService` connect `Community 4` to `Community 135`, `Community 40`, `Community 10`, `Community 75`, `Community 12`, `Community 14`, `Community 47`, `Community 16`, `Community 17`, `Community 22`, `Community 25`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `ChatbotService` connect `Community 3` to `Community 27`, `Community 14`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `mongoose`, `mongoose`, `mongoose` to the rest of the system?**
  _639 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.046462063086104004 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06095481670929241 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07243195785776997 - nodes in this community are weakly interconnected._