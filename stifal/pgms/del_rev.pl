#!/usr/bin/perl
use strict;
use warnings;

# Check input file
die "Usage: perl del_rev.pl input.seq\n" unless @ARGV == 1;

my $input_file = $ARGV[0];
open my $fh, '<', $input_file or die "Cannot open '$input_file': $!";

my %sequences;
my $current_header = '';

# Read and store sequences
while (my $line = <$fh>) {
    chomp $line;
    if ($line =~ /^>/) {
        $current_header = $line;
    } else {
        $sequences{$current_header} .= $line;
    }
}
close $fh;

# Print sequences with 'REVERSE' in the 4th field
for my $header (keys %sequences) {
    my @fields = split(/\s+/, $header);
    if ($fields[3] && $fields[3] eq 'REVERSE') {
        print "$header\n$sequences{$header}\n";
    }
}
