-- Sacred Circle YouTube video library imported from sacred_circle_youtube_video_library.xlsx
-- Videos are stored as YouTube links only. Do not download or host YouTube videos.

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000001', 'Guided Meditation: Connection to Great Central Sun & Galactic Beings', 'Sacred Circle video library item. Suggested category: Guided Meditation / Spiritual Development.', 'https://www.youtube.com/watch?v=bzK0ha1LNfI', 'https://i.ytimg.com/vi/bzK0ha1LNfI/hqdefault.jpg', 'Meditation', 1, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000002', 'Intuition क्या है? Kundalini Awakening; Past Life Heal करने का विज्ञान', 'Sacred Circle video library item. Suggested category: Intuition / Kundalini / Past Life.', 'https://www.youtube.com/watch?v=eYm0jfliXWU', 'https://i.ytimg.com/vi/eYm0jfliXWU/hqdefault.jpg', 'Spirituality', 2, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000003', 'Divine Matrix क्या है? सफलता का विज्ञान', 'Sacred Circle video library item. Suggested category: Divine Matrix / Success.', 'https://www.youtube.com/watch?v=kJMynrjNLAE', 'https://i.ytimg.com/vi/kJMynrjNLAE/hqdefault.jpg', 'Spirituality', 3, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000004', 'साधना की मंज़िल', 'Sacred Circle video library item. Suggested category: Sadhana.', 'https://www.youtube.com/watch?v=wdcQuk8Hb0g', 'https://i.ytimg.com/vi/wdcQuk8Hb0g/hqdefault.jpg', 'Spirituality', 4, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000005', 'आध्यात्मिक मुक्ति के लिए क्या करें? Arcturians से मदद; साधना के लिए यह सतयुग है', 'Sacred Circle video library item. Suggested category: Spiritual Liberation.', 'https://www.youtube.com/watch?v=wvVTGP2czT0', 'https://i.ytimg.com/vi/wvVTGP2czT0/hqdefault.jpg', 'Spirituality', 5, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000006', 'श्री गुरु दत्त: The Cosmic Guide; Ascended Masters कौन हैं? Spiritual Activation क्या है?', 'Sacred Circle video library item. Suggested category: Ascended Masters / Spiritual Activation.', 'https://www.youtube.com/watch?v=5NHP0Y94WrQ', 'https://i.ytimg.com/vi/5NHP0Y94WrQ/hqdefault.jpg', 'Spirituality', 6, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000007', 'बांग्ला देश में भगवान मदद क्यों नहीं कर रहे हैं?', 'Sacred Circle video library item. Suggested category: Spiritual Talk.', 'https://www.youtube.com/watch?v=CuyKlL0IsOU', 'https://i.ytimg.com/vi/CuyKlL0IsOU/hqdefault.jpg', 'Spirituality', 7, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000008', 'Guided Meditation for World Peace', 'Sacred Circle video library item. Suggested category: Guided Meditation / World Peace.', 'https://www.youtube.com/watch?v=RRhQQXhOx2c', 'https://i.ytimg.com/vi/RRhQQXhOx2c/hqdefault.jpg', 'Meditation', 8, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000009', 'क्या धरती सजीव है? Part 3: मंत्र जाप की सही विधि, चमत्कारों के रहस्य', 'Sacred Circle video library item. Suggested category: Healing & Meditation Workshop.', 'https://www.youtube.com/watch?v=kFJurSkzDkE', 'https://i.ytimg.com/vi/kFJurSkzDkE/hqdefault.jpg', 'Healing', 9, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000010', 'Mother Earth Meditation: Chakra Activation; धरती माता की चेतना से जुड़ना', 'Sacred Circle video library item. Suggested category: Mother Earth Meditation.', 'https://www.youtube.com/watch?v=icHVPbidq74', 'https://i.ytimg.com/vi/icHVPbidq74/hqdefault.jpg', 'Meditation', 10, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000011', 'Meta Healing क्या है? आप healing क्यों स्वीकार नहीं करते? Flight/Fight/Freeze response', 'Sacred Circle video library item. Suggested category: Meta Healing.', 'https://www.youtube.com/watch?v=P1gJheLi7gQ', 'https://i.ytimg.com/vi/P1gJheLi7gQ/hqdefault.jpg', 'Healing', 11, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000012', 'Meditation for Meta Healing: Energy Blocks heal नहीं होने दे रहे हैं उन्हें निकाल दें', 'Sacred Circle video library item. Suggested category: Meta Healing Meditation.', 'https://www.youtube.com/watch?v=fpyoSX0V2xM', 'https://i.ytimg.com/vi/fpyoSX0V2xM/hqdefault.jpg', 'Healing', 12, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000013', 'जीवन की समस्याओं से कैसे मुक्त हो? Finding and Removing Sub-conscious Blocks', 'Sacred Circle video library item. Suggested category: Sub-conscious Blocks.', 'https://www.youtube.com/watch?v=IQoZGVOCnZQ', 'https://i.ytimg.com/vi/IQoZGVOCnZQ/hqdefault.jpg', 'Spirituality', 13, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000014', 'How to find Sub-conscious Blocks?', 'Sacred Circle video library item. Suggested category: Sub-conscious Blocks.', 'https://www.youtube.com/watch?v=cgmduKGvfo4', 'https://i.ytimg.com/vi/cgmduKGvfo4/hqdefault.jpg', 'Spirituality', 14, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000015', 'Scientific Principles of Manifestation: आपके जीवन में भाग्योदय कैसे होता है?', 'Sacred Circle video library item. Suggested category: Manifestation.', 'https://www.youtube.com/watch?v=_gQe17H7Sl8', 'https://i.ytimg.com/vi/_gQe17H7Sl8/hqdefault.jpg', 'Manifestation', 15, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000016', 'Meditation for Manifestation: अपना भाग्योदय खुद करें; Lemurian Technique and Prana Shakti', 'Sacred Circle video library item. Suggested category: Manifestation Meditation.', 'https://www.youtube.com/watch?v=0kmq7p4LReM', 'https://i.ytimg.com/vi/0kmq7p4LReM/hqdefault.jpg', 'Manifestation', 16, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000017', 'Relationships-2: कटु संबंध में कैसे सुधार करें? मधुर संबंधों के लिए विशेष विधि', 'Sacred Circle video library item. Suggested category: Relationships.', 'https://www.youtube.com/watch?v=oL3A_YYoOXY', 'https://i.ytimg.com/vi/oL3A_YYoOXY/hqdefault.jpg', 'Relationships', 17, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000018', 'Relationships-3: Guided Meditation for Better Relationships', 'Sacred Circle video library item. Suggested category: Relationships Meditation.', 'https://www.youtube.com/watch?v=DauKdDvQPuY', 'https://i.ytimg.com/vi/DauKdDvQPuY/hqdefault.jpg', 'Relationships', 18, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000019', 'Successful कैसे बने? आपको success क्यों नहीं मिलता?', 'Sacred Circle video library item. Suggested category: Success.', 'https://www.youtube.com/watch?v=UQQAYkqdZGw', 'https://i.ytimg.com/vi/UQQAYkqdZGw/hqdefault.jpg', 'Manifestation', 19, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000020', 'Guided Meditation to Achieve Success and Abundance', 'Sacred Circle video library item. Suggested category: Success & Abundance Meditation.', 'https://www.youtube.com/watch?v=Uj4Mm1pEb8k', 'https://i.ytimg.com/vi/Uj4Mm1pEb8k/hqdefault.jpg', 'Manifestation', 20, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000021', 'मैं कौन हूँ? पाँच शरीर कैसे मिले? कर्म बंध और मुक्ति', 'Sacred Circle video library item. Suggested category: Self / Karma / Liberation.', 'https://www.youtube.com/watch?v=Do3NG-i5DVc', 'https://i.ytimg.com/vi/Do3NG-i5DVc/hqdefault.jpg', 'Spirituality', 21, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000022', 'भगवान धन्वंतरी द्वारा Healing: प्राणशक्ति क्या है? Intuition कैसे होता है?', 'Sacred Circle video library item. Suggested category: Healing / Prana Shakti / Intuition.', 'https://www.youtube.com/watch?v=LVqTLenpzeU', 'https://i.ytimg.com/vi/LVqTLenpzeU/hqdefault.jpg', 'Healing', 22, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000023', 'दैनिक कार्य करते हुए भी ध्यान में कैसे रहें?', 'Sacred Circle video library item. Suggested category: Meditation in Daily Life.', 'https://www.youtube.com/watch?v=8TpyNaQFzdk', 'https://i.ytimg.com/vi/8TpyNaQFzdk/hqdefault.jpg', 'Meditation', 23, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000024', 'Guided Meditation: जीवन से कोई भी डर कैसे निकाल दें?', 'Sacred Circle video library item. Suggested category: Fear Release Meditation.', 'https://www.youtube.com/watch?v=kmGPmqrRsjc', 'https://i.ytimg.com/vi/kmGPmqrRsjc/hqdefault.jpg', 'Meditation', 24, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000025', 'कर्म कैसे बनते हैं? कर्म कैसे कटते हैं? क्या कर्म भुगतने ही होते हैं?', 'Sacred Circle video library item. Suggested category: Karma.', 'https://www.youtube.com/watch?v=Ary1N4EqL8Y', 'https://i.ytimg.com/vi/Ary1N4EqL8Y/hqdefault.jpg', 'Spirituality', 25, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();

insert into public.videos (id, title, description, youtube_url, thumbnail_url, category, display_order, source_url, migration_status, status)
values ('52000000-0000-4000-8000-000000000026', 'Guided Meditation: Connecting with Higher Self', 'Sacred Circle video library item. Suggested category: Higher Self Meditation.', 'https://www.youtube.com/watch?v=0H1yUrW8WkA', 'https://i.ytimg.com/vi/0H1yUrW8WkA/hqdefault.jpg', 'Meditation', 26, 'https://sacredcirclegroup.com/videos', 'manual_review', 'published')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  youtube_url = excluded.youtube_url,
  thumbnail_url = excluded.thumbnail_url,
  category = excluded.category,
  display_order = excluded.display_order,
  source_url = excluded.source_url,
  migration_status = excluded.migration_status,
  status = excluded.status,
  updated_at = now();
