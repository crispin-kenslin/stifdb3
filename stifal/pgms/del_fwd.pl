#!/usr/bin/perl
use strict;
use warnings;

# Check for input file
die "Usage: perl del_fwd.pl input.seq\n" unless @ARGV == 1;

my $input_file = $ARGV[0];
open my $fh, '<', $input_file or die "Cannot open file '$input_file': $!";

my %sequences;
my $current_header = '';

# Read and parse the FASTA-like input
while (my $line = <$fh>) {
    chomp $line;
    if ($line =~ /^>/) {
        $current_header = $line;
    } else {
        $sequences{$current_header} .= $line;
    }
}
close $fh;

# Filter and print sequences with "FORWARD" in 4th field of the header
for my $header (keys %sequences) {
    my @fields = split(/\s+/, $header);
    if ($fields[3] && $fields[3] eq 'FORWARD') {
        print "$header\n$sequences{$header}\n";
    }
}
