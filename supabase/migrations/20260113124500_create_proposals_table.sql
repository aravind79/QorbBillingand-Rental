-- Create proposals table
create table proposals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  proposal_number text not null,
  title text not null,
  status text default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  client_id uuid references customers(id),
  client_snapshot jsonb,
  valid_until date,
  design_style text default 'classic',
  industry text default 'general',
  content jsonb default '{}'::jsonb,
  total_amount numeric default 0,
  currency text default 'INR',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table proposals enable row level security;

-- Create policies
create policy "Users can view their own proposals"
  on proposals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own proposals"
  on proposals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own proposals"
  on proposals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own proposals"
  on proposals for delete
  using (auth.uid() = user_id);
