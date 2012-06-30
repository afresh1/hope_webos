#!/usr/bin/perl
########################################################################
# get_hope.pl *** Converts the HOPE schedule and speakers to JSON
########################################################################
# Copyright (c) 2012 Andrew Fresh <andrew@afresh1.com>
#
# Permission to use, copy, modify, and distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
########################################################################
use strict;
use warnings;

use 5.010;

use DateTime;

use Mojo::Asset::File;
use Mojo::DOM;
use Mojo::UserAgent;
use Mojo::JSON;

my $base_uri = 'http://www.hopenumbernine.net/';
my $ua       = Mojo::UserAgent->new;

my $first_day = DateTime->new(
    year      => 2012,
    month     => 7,
    day       => 13,
    time_zone => 'America/New_York',
);

my %replace = (
    q{'} => qr/&rsquo;/,
    q{"} => qr/&ldquo;|&rdquo;/,
);

my $schedule = schedule();
print Mojo::JSON->new->encode($schedule);

sub speakers {

    #my $body = Mojo::Asset::File->new( path => 'Speakers.html' )->slurp;
    my $body = $ua->get( $base_uri . 'speakers/' )->res->body;
    $body =~ s/$replace{$_}/$_/gms for keys %replace;
    my $dom = Mojo::DOM->new($body);

    my %speakers;
    foreach my $bio ( $dom->find('#div_leftcol p')->each ) {
        my $name = $bio->at('a[name]');
        next unless $name;
        next unless $name->all_text;

        #$name->replace( $name->at('strong') );
        $name->replace('');

        $bio = $bio->content_xml;
        $bio =~ s/^\s+|\s+$//gs;

        $speakers{ $name->{name} } = {
            name => $name->all_text,
            bio  => $bio,
        };
    }
    return \%speakers;
}

sub schedule {

    #my $body = Mojo::Asset::File->new( path => 'Schedule.html' )->slurp;
    my $body = $ua->get( $base_uri . 'schedule/' )->res->body;
    $body =~ s/$replace{$_}/$_/gms for keys %replace;
    my $dom = Mojo::DOM->new($body);

    my $speakers = speakers();

    my %schedule;
    foreach my $talk ( $dom->find('#div_leftcol p')->each ) {
        my $tt = $talk->at('strong');
        next unless $tt;

        my $title = $tt->at('a[name]');

        next unless $title;
        $tt->replace('');
        $title->replace('');

        next if $title->{name} eq 'talks';

        my %talk = (
            id        => $title->{name},
            title     => $title->all_text,
            speakers  => [],
            timestamp => 0,
        );
        foreach my $speaker ( $tt->find('a[href]')->each ) {
            my $id = $speaker->{href} || '';
            $id =~ s{^.*/\#}{};
            next unless $id;
            $speaker->replace('');

            push @{ $talk{speakers} }, {
                name => $speaker->all_text,
                bio  => $speakers->{$id}->{bio} || '',
            };
        }

        my $ww = $talk->at('strong');
        if ($ww) {
            $ww->replace('');
            $ww = $ww->all_text;
        }
        elsif (my $content = $tt->all_text) {
            $ww = $content;
        }

        if ( $ww ) {
            $ww =~ s/^\s+|\s+$//g;
            my ( $day, $time, @rooms ) = split /\s+/, $ww;

            my $length = '';
            if ($rooms[-1] =~ /\)$/) {
                $length = join ' ', reverse pop(@rooms), pop(@rooms);
            }

            my %days = (
                saturday => 1,
                sunday   => 2,
            );

            my $minutes = $time % 100;
            my $hours   = int $time / 100;
            my $days    = $days{ lc $day } || 0;

            my $when = $first_day->clone->add(
                days    => $days,
                hours   => $hours,
                minutes => $minutes
            );

            $talk{when}      = "$when";
            $talk{timestamp} = $when->epoch;
            $talk{location}  = join ' ', @rooms;
            $talk{length}    = $length if $length;
        }

        $talk->find('br')->each( sub { $_[0]->replace('') } );

        $talk{description} = $talk->content_xml;
        $talk{description} =~ s/^\s+|\s+$//gs;

        $schedule{ $talk{id} } = \%talk;
    }

    my @schedule = map { $schedule{$_} }
        sort { $schedule{$a}{timestamp} <=> $schedule{$b}{timestamp} }
        keys %schedule;

    return \@schedule;
}
