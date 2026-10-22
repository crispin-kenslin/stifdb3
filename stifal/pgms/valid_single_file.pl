#!/usr/bin/perl

open FILE, "$ARGV[0]" || die "Type 'perl sepa_into_single.factor.pl x.out'\n";
@file = <FILE>;
close (FILE);

foreach (@file)
{
	chomp ($_);
	#if($_ =~/^>(\S+)\s+/)
	if($_ =~/^>(\w+)\s+/)
	{
#		print "KKKKKKKKKKKK :: $_\n";
		@split = split(/\s+|\t+|-|>/,$_);
			#print "LLLLLLLLLLLLLLLL$split[7] || $split[1]\n";



		$file_loc1 = $ARGV[1]."/"."$split[1]_valid.outout".$c; #name of the files + its increment
           
                $out="LL".$c;                  #Defining output in string variable
                open"$out",">$file_loc1";
		$c++;
		print $out "$_\n";
	}	
	else #if($_ =~/\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\* END OF FILE\*\*\*\*\*\*\*\*\*8/)
	{	
		print $out "$_\n";
	}	
} 
